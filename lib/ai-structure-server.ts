import type {
  AiStructureRequest,
  AiStructuredResult,
  AiTableCell,
} from "@/types/ocr";
import type { AiNativeOcrRequest } from "@/types/ai-native";

const DEFAULT_TIMEOUT_MS = 60_000;
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 300_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_OCR_ITEMS = 2_000;
const MAX_OCR_TEXT_LENGTH = 200_000;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const OUTPUT_SCHEMA = {
  name: "ocr_spreadsheet",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["columns", "rows", "corrections", "warnings"],
    properties: {
      columns: {
        type: "array",
        minItems: 1,
        items: { type: "string" },
      },
      rows: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["cells"],
          properties: {
            cells: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["value", "sourceText", "needsReview", "reason"],
                properties: {
                  value: { type: "string" },
                  sourceText: { type: "string" },
                  needsReview: { type: "boolean" },
                  reason: { type: "string" },
                },
              },
            },
          },
        },
      },
      corrections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["original", "corrected", "reason"],
          properties: {
            original: { type: "string" },
            corrected: { type: "string" },
            reason: { type: "string" },
          },
        },
      },
      warnings: {
        type: "array",
        items: { type: "string" },
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `You convert screenshots and OCR output into faithful spreadsheet tables.

Rules:
- Reconstruct the visible rows and columns; do not summarize the document.
- Correct OCR mistakes only when the screenshot or surrounding structure supports the correction.
- Preserve numeric formatting, signs, decimal separators, currencies, dates, identifiers, and leading zeroes.
- Never invent a missing value. Use an empty string and mark needsReview when uncertain.
- Each row must contain exactly one cell for every column, in the same order.
- sourceText must contain the closest raw OCR text used for the cell, or an empty string.
- needsReview must be true when a value is uncertain, inferred, or cannot be matched confidently.
- reason must briefly explain uncertainty; otherwise use an empty string.
- List material text corrections separately. Do not include harmless whitespace-only changes.
- Return only the requested JSON object.`;

const NATIVE_OCR_SYSTEM_PROMPT = `You are a native visual OCR and table-reconstruction engine.

Your goal is to turn the supplied image into a readable, spreadsheet-ready table.

How to structure the image:
- First determine whether the image is an existing table, a form, a receipt, or a document containing repeated records.
- For an existing table, preserve its visible column order and create one output row for each visible data row.
- For a form or single-record document, convert field labels into columns and their values into one data row.
- For repeated sections or records, use one consistent set of columns and create one row per logical record.
- Use concise, human-readable column names in the document's language. Do not use generic names such as field_1 when a visible label or clear semantic name exists.
- Do not add titles, instructions, page furniture, signatures, or table headers as data rows.
- Keep multi-line text belonging to one field in the same cell, separated by newlines.

Accuracy rules:
- Read the image directly; no separate OCR text is provided.
- Preserve spelling unless a correction is visually clear.
- Preserve numeric formatting, signs, decimal separators, currencies, dates, identifiers, serial numbers, and leading zeroes as text.
- Never invent a missing value. Use an empty string and mark needsReview when uncertain or unreadable.
- Every row must contain exactly one cell for every column, in the same order.
- sourceText must contain the closest visible text used for the cell, or an empty string.
- needsReview must be true when a value is uncertain, inferred, or unreadable.
- reason must briefly explain uncertainty; otherwise use an empty string.
- List material visual-reading corrections separately.

Output rules:
- Return only one JSON object. Do not include Markdown or commentary.
- Use the top-level keys columns, rows, corrections, and warnings.
- columns must be an array of column-name strings.
- rows must be an array of objects with a cells array.
- Each cell must contain value, sourceText, needsReview, and reason.`;

export interface AiProviderConfig {
  endpoint: string;
  model: string;
  apiKey?: string;
  timeoutMs: number;
}

export interface AiRequestOptions {
  config?: AiProviderConfig;
  fetchImpl?: typeof fetch;
}

export class AiStructureError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AiStructureError";
  }
}

function parseTimeout(value: string | undefined): number {
  if (!value) return DEFAULT_TIMEOUT_MS;
  const timeout = Number(value);
  if (!Number.isInteger(timeout) || timeout < MIN_TIMEOUT_MS || timeout > MAX_TIMEOUT_MS) {
    throw new AiStructureError(
      `AI_TIMEOUT_MS must be an integer between ${MIN_TIMEOUT_MS} and ${MAX_TIMEOUT_MS}.`,
      500,
    );
  }
  return timeout;
}

function buildEndpoint(baseUrl: string): string {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new AiStructureError("AI_BASE_URL is not a valid URL.", 500);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new AiStructureError("AI_BASE_URL must use HTTP or HTTPS.", 500);
  }
  if (url.username || url.password) {
    throw new AiStructureError("AI_BASE_URL must not contain credentials.", 500);
  }
  if (url.search || url.hash) {
    throw new AiStructureError("AI_BASE_URL must not contain a query string or fragment.", 500);
  }

  const pathname = url.pathname.replace(/\/+$/, "");
  url.pathname = `${pathname}/chat/completions`;
  return url.toString();
}

export function getAiProviderConfig(env: NodeJS.ProcessEnv = process.env): AiProviderConfig {
  const baseUrl = env.AI_BASE_URL?.trim();
  const model = env.AI_MODEL?.trim();

  if (!baseUrl || !model) {
    throw new AiStructureError(
      "AI enhancement is not configured. Set AI_BASE_URL and AI_MODEL on the server.",
      503,
    );
  }

  return {
    endpoint: buildEndpoint(baseUrl),
    model,
    apiKey: env.AI_API_KEY?.trim() || undefined,
    timeoutMs: parseTimeout(env.AI_TIMEOUT_MS),
  };
}

function validateImage(image: unknown): asserts image is string {
  if (typeof image !== "string") {
    throw new AiStructureError("A base64 image data URL is required.", 400);
  }

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(image);
  if (!match || !SUPPORTED_IMAGE_TYPES.has(match[1].toLowerCase())) {
    throw new AiStructureError("Image must be a PNG, JPEG, or WEBP data URL.", 415);
  }

  const base64 = match[2].replace(/\s/g, "");
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const byteLength = Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
  if (byteLength === 0 || byteLength > MAX_IMAGE_BYTES) {
    throw new AiStructureError("Image must be non-empty and no larger than 10 MB.", 413);
  }
}

function validateInput(input: unknown): asserts input is AiStructureRequest {
  if (!input || typeof input !== "object") {
    throw new AiStructureError("Request body must be a JSON object.", 400);
  }

  const { image, ocr } = input as Partial<AiStructureRequest>;
  validateImage(image);

  if (!ocr || !Array.isArray(ocr.items)) {
    throw new AiStructureError("A normalized OCR result is required.", 400);
  }
  if (ocr.items.length > MAX_OCR_ITEMS) {
    throw new AiStructureError(`OCR result cannot contain more than ${MAX_OCR_ITEMS} items.`, 413);
  }

  let textLength = 0;
  for (const item of ocr.items) {
    if (!item || typeof item.text !== "string" || typeof item.score !== "number") {
      throw new AiStructureError("Every OCR item must contain text and a numeric score.", 400);
    }
    textLength += item.text.length;
  }
  if (textLength > MAX_OCR_TEXT_LENGTH) {
    throw new AiStructureError("OCR text is too large to process.", 413);
  }
}

function validateNativeInput(input: unknown): asserts input is AiNativeOcrRequest {
  if (!input || typeof input !== "object") {
    throw new AiStructureError("Request body must be a JSON object.", 400);
  }

  const { image, columns } = input as Partial<AiNativeOcrRequest>;
  validateImage(image);
  if (columns === undefined) return;
  if (
    !Array.isArray(columns) ||
    columns.length === 0 ||
    columns.length > 100 ||
    !columns.every((column) => typeof column === "string" && column.trim().length > 0 && column.length <= 200)
  ) {
    throw new AiStructureError("Existing columns must contain 1 to 100 valid column names.", 400);
  }
  if (new Set(columns).size !== columns.length) {
    throw new AiStructureError("Existing columns must be unique.", 400);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function scalarToString(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "boolean") return String(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function normalizeCell(value: unknown): AiTableCell | undefined {
  const scalarValue = scalarToString(value);
  if (scalarValue !== undefined) {
    return {
      value: scalarValue,
      sourceText: scalarValue,
      needsReview: false,
      reason: "",
    };
  }

  if (value === null) {
    return {
      value: "",
      sourceText: "",
      needsReview: true,
      reason: "The AI returned a null value.",
    };
  }

  if (!isRecord(value)) return undefined;

  const normalizedValue = value.value === null
    ? ""
    : scalarToString(value.value) ?? scalarToString(value.sourceText);
  if (normalizedValue === undefined) return undefined;

  const sourceText = value.sourceText === null
    ? ""
    : scalarToString(value.sourceText) ?? normalizedValue;
  const needsReview = typeof value.needsReview === "boolean"
    ? value.needsReview
    : value.needsReview === "true";
  const reason = scalarToString(value.reason) ?? "";

  return {
    value: normalizedValue,
    sourceText,
    needsReview: value.value === null ? true : needsReview,
    reason: value.value === null && !reason ? "The AI returned a null value." : reason,
  };
}

function getRowList(value: Record<string, unknown>): unknown[] | undefined {
  const rowLists = [value.rows, value.records, value.data].filter(Array.isArray);
  return rowLists[0];
}

export function validateStructuredResult(value: unknown): AiStructuredResult {
  if (!isRecord(value)) {
    throw new AiStructureError("The AI response does not contain a valid column list.", 502);
  }

  const responseColumns = isStringArray(value.columns) ? value.columns : undefined;
  const responseHeaders = isStringArray(value.headers) ? value.headers : undefined;
  if (!responseColumns && !responseHeaders) {
    throw new AiStructureError("The AI response does not contain a valid column list.", 502);
  }
  if (
    responseColumns &&
    responseHeaders &&
    (responseColumns.length !== responseHeaders.length ||
      !responseColumns.every((column, index) => column === responseHeaders[index]))
  ) {
    throw new AiStructureError("The AI response contains conflicting columns and headers.", 502);
  }

  const columns = responseColumns ?? responseHeaders;
  if (!columns || columns.length === 0) {
    throw new AiStructureError("The AI response does not contain a valid column list.", 502);
  }
  if (new Set(columns).size !== columns.length) {
    throw new AiStructureError("The AI response contains duplicate column names.", 502);
  }
  const rowList = getRowList(value);
  if (!rowList) {
    throw new AiStructureError("The AI response does not contain a valid row list.", 502);
  }

  const rows = rowList.map((row, rowIndex) => {
    if (Array.isArray(row)) {
      const cells = row.map(normalizeCell);
      if (cells.some((cell) => cell === undefined)) {
        throw new AiStructureError(`AI row ${rowIndex + 1} contains invalid cells.`, 502);
      }
      if (cells.length !== columns.length) {
        throw new AiStructureError(
          `AI row ${rowIndex + 1} has ${cells.length} cells; expected ${columns.length}.`,
          502,
        );
      }
      return { cells: cells as AiTableCell[] };
    }

    if (!isRecord(row)) {
      throw new AiStructureError(`AI row ${rowIndex + 1} contains invalid cells.`, 502);
    }

    if (Array.isArray(row.cells)) {
      const cells = row.cells.map(normalizeCell);
      if (cells.some((cell) => cell === undefined)) {
        throw new AiStructureError(`AI row ${rowIndex + 1} contains invalid cells.`, 502);
      }
      if (cells.length !== columns.length) {
        throw new AiStructureError(
          `AI row ${rowIndex + 1} has ${cells.length} cells; expected ${columns.length}.`,
          502,
        );
      }
      return { cells: cells as AiTableCell[] };
    }

    const rowKeys = Object.keys(row);
    const unexpectedKeys = rowKeys.filter((key) => !columns.includes(key));
    const keyedCells = columns.map((column) => normalizeCell(row[column]));
    if (unexpectedKeys.length > 0 || keyedCells.some((cell) => cell === undefined)) {
      const detail = unexpectedKeys.length > 0
        ? ` Unexpected fields: ${unexpectedKeys.join(", ")}.`
        : "";
      throw new AiStructureError(
        `AI row ${rowIndex + 1} contains invalid or missing column cells.${detail}`,
        502,
      );
    }
    return { cells: keyedCells as AiTableCell[] };
  });

  if (value.corrections !== undefined && !Array.isArray(value.corrections)) {
    throw new AiStructureError("The AI response has an invalid corrections list.", 502);
  }
  const corrections = (value.corrections ?? []).map((correction) => {
    if (
      !isRecord(correction) ||
      typeof correction.original !== "string" ||
      typeof correction.corrected !== "string" ||
      typeof correction.reason !== "string"
    ) {
      throw new AiStructureError("The AI response contains an invalid correction.", 502);
    }
    return {
      original: correction.original,
      corrected: correction.corrected,
      reason: correction.reason,
    };
  });

  if (value.warnings !== undefined && !isStringArray(value.warnings)) {
    throw new AiStructureError("The AI response has an invalid warnings list.", 502);
  }

  return {
    columns,
    rows,
    corrections,
    warnings: value.warnings ?? [],
  };
}

function extractMessageContent(payload: unknown): string {
  if (!isRecord(payload) || !Array.isArray(payload.choices) || payload.choices.length === 0) {
    throw new AiStructureError("The AI provider returned an unexpected response.", 502);
  }
  const choice = payload.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) {
    throw new AiStructureError("The AI provider returned an unexpected response.", 502);
  }

  const content = choice.message.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const text = content
      .filter(isRecord)
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("");
    if (text) return text;
  }
  throw new AiStructureError("The AI provider returned no structured content.", 502);
}

function parseModelJson(content: string): unknown {
  const normalized = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(normalized);
  } catch {
    throw new AiStructureError("The AI provider returned malformed JSON.", 502);
  }
}

function providerError(status: number): AiStructureError {
  if (status === 401 || status === 403) {
    return new AiStructureError("The configured AI provider rejected its credentials.", 502);
  }
  if (status === 429) {
    return new AiStructureError("The configured AI provider is rate limited. Try again shortly.", 503);
  }
  return new AiStructureError(`The configured AI provider returned HTTP ${status}.`, 502);
}

function buildPayload(input: AiStructureRequest, config: AiProviderConfig, strict: boolean) {
  return {
    model: config.model,
    stream: false,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Reconstruct this screenshot as a spreadsheet. Here is the normalized OCR output:\n${JSON.stringify(input.ocr)}`,
          },
          {
            type: "image_url",
            image_url: { url: input.image, detail: "high" },
          },
        ],
      },
    ],
    response_format: strict
      ? { type: "json_schema", json_schema: OUTPUT_SCHEMA }
      : { type: "json_object" },
  };
}

function buildNativePayload(
  input: AiNativeOcrRequest,
  config: AiProviderConfig,
  strict: boolean,
) {
  const schemaInstruction = input.columns?.length
    ? `This image continues an existing workbook. Use exactly these columns, in this exact order: ${JSON.stringify(input.columns)}. Map visually similar fields to those columns. Do not rename, add, remove, or reorder columns. If a column is not visible in this image, return an empty reviewed cell for it. Extract only the records visible in this new image so they can be appended as new rows.`
    : "This is the first image in a new workbook. Analyze its visual structure, infer concise human-readable columns, and extract every visible logical record. If it is a form, use its labels as columns and create one row from its values. If it is already a table, preserve its column order and data-row boundaries.";

  return {
    model: config.model,
    stream: false,
    messages: [
      { role: "system", content: NATIVE_OCR_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: schemaInstruction },
          {
            type: "image_url",
            image_url: { url: input.image, detail: "high" },
          },
        ],
      },
    ],
    response_format: strict
      ? { type: "json_schema", json_schema: OUTPUT_SCHEMA }
      : { type: "json_object" },
  };
}

async function callProvider(
  payload: unknown,
  config: AiProviderConfig,
  fetchImpl: typeof fetch,
  signal: AbortSignal,
): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  return fetchImpl(config.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal,
    cache: "no-store",
  });
}

async function requestTableFromProvider(
  buildRequest: (strict: boolean) => unknown,
  config: AiProviderConfig,
  fetchImpl: typeof fetch,
): Promise<AiStructuredResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    let response = await callProvider(buildRequest(true), config, fetchImpl, controller.signal);

    if (!response.ok && [400, 404, 415, 422].includes(response.status)) {
      response = await callProvider(buildRequest(false), config, fetchImpl, controller.signal);
    }
    if (!response.ok) throw providerError(response.status);

    let rawBody: string;
    try {
      rawBody = await response.text();
    } catch {
      throw new AiStructureError("The AI provider response body could not be read.", 502);
    }

    if (!rawBody.trim()) {
      throw new AiStructureError(
        `The AI provider returned an empty response body (HTTP ${response.status}).`,
        502,
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      const contentType = response.headers.get("content-type")?.split(";")[0] || "unknown";
      if (contentType === "text/event-stream") {
        throw new AiStructureError(
          "The AI provider returned a streaming response even though streaming was disabled.",
          502,
        );
      }
      throw new AiStructureError(
        `The AI provider returned a non-JSON response (HTTP ${response.status}, ${contentType}).`,
        502,
      );
    }

    const modelContent = extractMessageContent(payload);
    const modelResult = parseModelJson(modelContent);
    console.log(
      "[AI Provider] Decoded model result:\n",
      JSON.stringify(modelResult, null, 2),
    );
    return validateStructuredResult(modelResult);
  } catch (error) {
    if (error instanceof AiStructureError) throw error;
    if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new AiStructureError("The AI provider request timed out.", 504);
    }
    throw new AiStructureError("The AI provider could not be reached.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestStructuredTable(
  input: unknown,
  options: AiRequestOptions = {},
): Promise<AiStructuredResult> {
  validateInput(input);
  const config = options.config ?? getAiProviderConfig();
  const fetchImpl = options.fetchImpl ?? fetch;
  return requestTableFromProvider(
    (strict) => buildPayload(input, config, strict),
    config,
    fetchImpl,
  );
}

export async function requestNativeTable(
  input: unknown,
  options: AiRequestOptions = {},
): Promise<AiStructuredResult> {
  validateNativeInput(input);
  const config = options.config ?? getAiProviderConfig();
  const fetchImpl = options.fetchImpl ?? fetch;
  const result = await requestTableFromProvider(
    (strict) => buildNativePayload(input, config, strict),
    config,
    fetchImpl,
  );

  if (input.columns && !input.columns.every((column, index) => result.columns[index] === column)) {
    throw new AiStructureError(
      "The AI changed the existing workbook columns. Start a new session for a different document format.",
      502,
    );
  }
  if (input.columns && result.columns.length !== input.columns.length) {
    throw new AiStructureError(
      "The AI changed the existing workbook columns. Start a new session for a different document format.",
      502,
    );
  }

  return result;
}
