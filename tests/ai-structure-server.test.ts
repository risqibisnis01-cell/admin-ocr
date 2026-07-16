import { describe, expect, it, vi } from "vitest";
import {
  AiStructureError,
  getAiProviderConfig,
  requestNativeTable,
  requestStructuredTable,
} from "@/lib/ai-structure-server";
import type { AiProviderConfig } from "@/lib/ai-structure-server";

const input = {
  image: "data:image/png;base64,iVBORw0KGgo=",
  ocr: {
    image: { width: 100, height: 100 },
    items: [{ text: "Name  Amount", score: 0.92, poly: [[0, 0], [50, 0], [50, 10], [0, 10]] }],
    metrics: { detMs: 1, recMs: 1, totalMs: 2, detectedBoxes: 1, recognizedCount: 1 },
    runtime: { backend: "test", provider: "test" },
  },
};

const result = {
  columns: ["Name", "Amount"],
  rows: [
    {
      cells: [
        { value: "Alice", sourceText: "Alice", needsReview: false, reason: "" },
        { value: "10.00", sourceText: "10.OO", needsReview: false, reason: "" },
      ],
    },
  ],
  corrections: [{ original: "10.OO", corrected: "10.00", reason: "Numeric context" }],
  warnings: [],
};

const config: AiProviderConfig = {
  endpoint: "https://provider.example/v1/chat/completions",
  model: "vision-model",
  apiKey: "top-secret",
  timeoutMs: 1_000,
};

function providerResponse(content = JSON.stringify(result), status = 200) {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

describe("getAiProviderConfig", () => {
  it("builds a Chat Completions endpoint without exposing configuration to the client", () => {
    expect(
      getAiProviderConfig({
        AI_BASE_URL: "https://provider.example/v1/",
        AI_MODEL: "vision-model",
        AI_API_KEY: "secret",
        AI_TIMEOUT_MS: "45000",
      }),
    ).toEqual({
      endpoint: "https://provider.example/v1/chat/completions",
      model: "vision-model",
      apiKey: "secret",
      timeoutMs: 45_000,
    });
  });

  it("rejects URLs with embedded credentials", () => {
    expect(() =>
      getAiProviderConfig({
        AI_BASE_URL: "https://user:pass@provider.example/v1",
        AI_MODEL: "vision-model",
      }),
    ).toThrow("must not contain credentials");
  });
});

describe("requestStructuredTable", () => {
  it("sends image, OCR, model, strict schema, and optional authorization", async () => {
    const fetchMock = vi.fn(async () => providerResponse());
    const response = await requestStructuredTable(input, {
      config,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    expect(response).toEqual(result);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(config.endpoint);
    expect(init.headers).toMatchObject({ Authorization: "Bearer top-secret" });
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe("vision-model");
    expect(body.stream).toBe(false);
    expect(body.response_format.type).toBe("json_schema");
    expect(body.messages[1].content[1].image_url.url).toBe(input.image);
    expect(body.messages[1].content[0].text).toContain("Name  Amount");
  });

  it("retries once in JSON-object mode when strict output is unsupported", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("unsupported", { status: 400 }))
      .mockResolvedValueOnce(providerResponse());

    await requestStructuredTable(input, {
      config,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const fallbackBody = JSON.parse(String(fetchMock.mock.calls[1][1].body));
    expect(fallbackBody.response_format).toEqual({ type: "json_object" });
  });

  it("rejects malformed model JSON", async () => {
    const fetchMock = vi.fn(async () => providerResponse("not json"));
    await expect(
      requestStructuredTable(input, { config, fetchImpl: fetchMock as unknown as typeof fetch }),
    ).rejects.toMatchObject({ status: 502, message: "The AI provider returned malformed JSON." });
  });

  it("reports providers that ignore disabled streaming", async () => {
    const fetchMock = vi.fn(async () =>
      new Response('data: {"choices":[]}\n\ndata: [DONE]\n\n', {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }),
    );
    await expect(
      requestStructuredTable(input, { config, fetchImpl: fetchMock as unknown as typeof fetch }),
    ).rejects.toMatchObject({
      status: 502,
      message: "The AI provider returned a streaming response even though streaming was disabled.",
    });
  });

  it("does not expose upstream authentication response bodies or the API key", async () => {
    const fetchMock = vi.fn(async () => new Response("top-secret diagnostic", { status: 401 }));
    let failure: unknown;
    try {
      await requestStructuredTable(input, {
        config,
        fetchImpl: fetchMock as unknown as typeof fetch,
      });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(AiStructureError);
    expect(String(failure)).not.toContain("top-secret");
    expect(String(failure)).not.toContain("diagnostic");
  });

  it("reports unreachable providers safely", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("connect ECONNREFUSED provider.internal");
    });
    await expect(
      requestStructuredTable(input, { config, fetchImpl: fetchMock as unknown as typeof fetch }),
    ).rejects.toMatchObject({ status: 502, message: "The AI provider could not be reached." });
  });

  it("times out stalled provider requests", async () => {
    const fetchMock = vi.fn((_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      }),
    );
    await expect(
      requestStructuredTable(input, {
        config: { ...config, timeoutMs: 10 },
        fetchImpl: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toMatchObject({ status: 504, message: "The AI provider request timed out." });
  });

  it("rejects inconsistent table rows", async () => {
    const invalid = {
      ...result,
      rows: [{ cells: [result.rows[0].cells[0]] }],
    };
    const fetchMock = vi.fn(async () => providerResponse(JSON.stringify(invalid)));
    await expect(
      requestStructuredTable(input, { config, fetchImpl: fetchMock as unknown as typeof fetch }),
    ).rejects.toMatchObject({ status: 502, message: expect.stringContaining("expected 2") });
  });

  it("normalizes provider rows keyed by column name", async () => {
    const keyedResult = {
      ...result,
      rows: [
        {
          Name: result.rows[0].cells[0],
          Amount: result.rows[0].cells[1],
        },
      ],
    };
    const fetchMock = vi.fn(async () => providerResponse(JSON.stringify(keyedResult)));
    await expect(
      requestStructuredTable(input, {
        config,
        fetchImpl: fetchMock as unknown as typeof fetch,
      }),
    ).resolves.toEqual(result);
  });

  it("normalizes records aliases and scalar cell values", async () => {
    const recordsResult = {
      columns: ["Nama", "Kelas", "Umur"],
      records: [
        {
          Nama: { value: "Jordi", sourceText: "Jordi", needsReview: false, reason: "" },
          Kelas: { value: "8a", sourceText: "8a", needsReview: false, reason: "" },
          Umur: { value: 9, sourceText: "9", needsReview: false, reason: "" },
        },
      ],
    };
    const fetchMock = vi.fn(async () => providerResponse(JSON.stringify(recordsResult)));

    await expect(
      requestStructuredTable(input, {
        config,
        fetchImpl: fetchMock as unknown as typeof fetch,
      }),
    ).resolves.toEqual({
      columns: recordsResult.columns,
      rows: [
        {
          cells: [
            { value: "Jordi", sourceText: "Jordi", needsReview: false, reason: "" },
            { value: "8a", sourceText: "8a", needsReview: false, reason: "" },
            { value: "9", sourceText: "9", needsReview: false, reason: "" },
          ],
        },
      ],
      corrections: [],
      warnings: [],
    });
  });

  it("normalizes data aliases and positional scalar rows", async () => {
    const dataResult = {
      headers: ["Name", "Active", "Count"],
      data: [["Alice", true, 3]],
    };
    const fetchMock = vi.fn(async () => providerResponse(JSON.stringify(dataResult)));

    await expect(
      requestStructuredTable(input, {
        config,
        fetchImpl: fetchMock as unknown as typeof fetch,
      }),
    ).resolves.toEqual({
      columns: dataResult.headers,
      rows: [
        {
          cells: [
            { value: "Alice", sourceText: "Alice", needsReview: false, reason: "" },
            { value: "true", sourceText: "true", needsReview: false, reason: "" },
            { value: "3", sourceText: "3", needsReview: false, reason: "" },
          ],
        },
      ],
      corrections: [],
      warnings: [],
    });
  });

  it("rejects unexpected fields in a keyed provider row", async () => {
    const keyedResult = {
      ...result,
      rows: [
        {
          Name: result.rows[0].cells[0],
          Amount: result.rows[0].cells[1],
          Unexpected: result.rows[0].cells[0],
        },
      ],
    };
    const fetchMock = vi.fn(async () => providerResponse(JSON.stringify(keyedResult)));
    await expect(
      requestStructuredTable(input, {
        config,
        fetchImpl: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining("Unexpected fields: Unexpected"),
    });
  });

  it("defaults omitted diagnostic lists for partially compliant providers", async () => {
    const keyedResult = {
      columns: result.columns,
      rows: [
        {
          Name: result.rows[0].cells[0],
          Amount: result.rows[0].cells[1],
        },
      ],
    };
    const fetchMock = vi.fn(async () => providerResponse(JSON.stringify(keyedResult)));
    await expect(
      requestStructuredTable(input, {
        config,
        fetchImpl: fetchMock as unknown as typeof fetch,
      }),
    ).resolves.toEqual({
      columns: result.columns,
      rows: result.rows,
      corrections: [],
      warnings: [],
    });
  });

  it("normalizes headers as an alias for columns", async () => {
    const headerResult = {
      headers: result.columns,
      rows: result.rows,
    };
    const fetchMock = vi.fn(async () => providerResponse(JSON.stringify(headerResult)));
    await expect(
      requestStructuredTable(input, {
        config,
        fetchImpl: fetchMock as unknown as typeof fetch,
      }),
    ).resolves.toEqual({
      columns: result.columns,
      rows: result.rows,
      corrections: [],
      warnings: [],
    });
  });

  it("rejects conflicting columns and headers", async () => {
    const headerResult = {
      columns: result.columns,
      headers: ["Different", "Headers"],
      rows: result.rows,
    };
    const fetchMock = vi.fn(async () => providerResponse(JSON.stringify(headerResult)));
    await expect(
      requestStructuredTable(input, {
        config,
        fetchImpl: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toMatchObject({
      status: 502,
      message: "The AI response contains conflicting columns and headers.",
    });
  });
});

describe("requestNativeTable", () => {
  it("reads a first image directly and allows the model to establish columns", async () => {
    const fetchMock = vi.fn(async () => providerResponse());
    const response = await requestNativeTable(
      { image: input.image },
      { config, fetchImpl: fetchMock as unknown as typeof fetch },
    );

    expect(response).toEqual(result);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body.stream).toBe(false);
    expect(body.messages[1].content[0].text).toContain("first image");
    expect(body.messages[1].content[0].text).toContain("If it is a form");
    expect(body.messages[0].content).toContain("spreadsheet-ready table");
    expect(body.messages[0].content).toContain("top-level keys columns, rows");
    expect(body.messages[1].content[1].image_url.url).toBe(input.image);
  });

  it("locks later images to the existing workbook columns", async () => {
    const fetchMock = vi.fn(async () => providerResponse());
    await expect(
      requestNativeTable(
        { image: input.image, columns: ["Name", "Amount"] },
        { config, fetchImpl: fetchMock as unknown as typeof fetch },
      ),
    ).resolves.toEqual(result);

    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body.messages[1].content[0].text).toContain('["Name","Amount"]');
    expect(body.messages[1].content[0].text).toContain("appended as new rows");
  });

  it("rejects a later image when the model changes the workbook schema", async () => {
    const changedSchema = { ...result, columns: ["Different", "Columns"] };
    const fetchMock = vi.fn(async () => providerResponse(JSON.stringify(changedSchema)));
    await expect(
      requestNativeTable(
        { image: input.image, columns: ["Name", "Amount"] },
        { config, fetchImpl: fetchMock as unknown as typeof fetch },
      ),
    ).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining("changed the existing workbook columns"),
    });
  });
});
