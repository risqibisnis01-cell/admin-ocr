# VisionExtract OCR Workspace

VisionExtract converts screenshots into editable OCR text and Excel-ready tables. It supports client-side PaddleOCR and Tesseract, Google Vision OCR, and optional AI correction/table reconstruction through any OpenAI-compatible vision endpoint.

## Setup

Install dependencies and copy the example environment configuration:

```bash
npm install
copy .env.example .env.local
```

Configure the AI provider in `.env.local`:

```env
APP_PASSWORD=replace-with-a-strong-password
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_API_KEY=your-secret-key
AI_TIMEOUT_MS=60000
```

`APP_PASSWORD` is required and must contain 8–1,024 characters. Users enter this password on `/login`. Successful login creates an HTTP-only, same-site session cookie that expires after 24 hours. Use the Logout button to lock the workspace immediately.

- `AI_BASE_URL` must be an HTTP or HTTPS `/v1` base URL. The server appends `/chat/completions`.
- `AI_MODEL` must support image input and JSON output.
- `AI_API_KEY` is optional for unauthenticated local providers.
- `AI_TIMEOUT_MS` defaults to 60 seconds and accepts values from 1,000 to 300,000 milliseconds.

Example for LM Studio:

```env
AI_BASE_URL=http://127.0.0.1:1234/v1
AI_MODEL=your-loaded-vision-model
AI_API_KEY=
```

Environment variables are read only on the server and are never sent to the browser. Restart the development server after changing `.env.local`.

For Google Vision OCR, also set:

```env
GOOGLE_VISION_API_KEY=your-google-key
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Upload or paste a screenshot. Raw OCR becomes available first; AI correction and spreadsheet reconstruction then run separately. If AI is unavailable, raw OCR remains editable and exportable.

## AI Native OCR sessions

Open `/ai-native` to extract data directly from images without running PaddleOCR, Tesseract, or Google Vision first.

1. Upload the first image to let the configured vision model establish the workbook columns.
2. Upload or paste similar images one at a time. Extracted records are appended to the existing rows and must keep the original column order.
3. Edit or delete rows, then copy the table to Excel or export CSV.
4. Select **New session** to remove the current browser-stored workbook and start with a new schema.

The active workbook is stored in browser local storage so it survives refreshes. Uploaded images are sent to the configured AI provider for extraction but are not stored in the browser session.

## Verification

```bash
npm test
npm run lint
npm run build
```

The AI endpoint accepts PNG, JPEG, and WEBP data URLs up to 10 MB. Screenshots and OCR results are transmitted to the configured provider but are not stored by this application.
