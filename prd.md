# Product Requirements Document (PRD)

# OCR Screenshot to Excel

## Version

1.0 (MVP)

## Product Overview

OCR Screenshot to Excel is a lightweight web application that allows users to:

- Upload an image
- Paste a screenshot directly from the clipboard
- Extract text using PaddleOCR running entirely on the client side
- Review extracted data
- Copy results directly into Excel

No login, backend server, database, or cloud storage is required.

The application is designed for speed and simplicity.

---

# Product Goal

Allow users to convert screenshots into Excel-ready data within seconds.

### Success Criteria

- OCR processing completed in under 5 seconds for common screenshots
- User can paste screenshot and get results in under 3 clicks
- Copy-to-Excel works with Excel and Google Sheets

---

# Target Users

- Operations teams
- Finance users
- Data entry staff
- Business analysts
- Anyone copying information from screenshots into spreadsheets

---

# Scope

## Included in MVP

✅ Upload image

✅ Paste screenshot (Ctrl+V)

✅ Client-side OCR using PaddleOCR

✅ Display OCR results

✅ Editable table

✅ Copy to clipboard

✅ Export CSV

---

## Excluded from MVP

❌ User accounts

❌ Database

❌ Backend API

❌ Cloud storage

❌ PDF OCR

❌ Batch processing

❌ History tracking

❌ Authentication

---

# Core User Flow

## Flow 1: Paste Screenshot

User takes screenshot

↓

Open application

↓

Press Ctrl + V

↓

Image preview appears

↓

OCR runs automatically

↓

Results displayed in table

↓

Click "Copy to Excel"

↓

Paste into Excel

---

## Flow 2: Upload Image

User uploads image

↓

Image preview appears

↓

OCR runs automatically

↓

Results displayed

↓

Copy or export

---

# Functional Requirements

## FR-001 Upload Image

### Description

User can upload image files.

### Supported Formats

- PNG
- JPG
- JPEG
- WEBP

### Acceptance Criteria

- Select file from device
- Preview image immediately
- OCR starts automatically

---

## FR-002 Paste Screenshot

### Description

User can paste screenshots directly.

### Acceptance Criteria

- Supports Ctrl+V
- Detect clipboard images
- Display preview
- Start OCR automatically

---

## FR-003 Image Preview

### Description

Display uploaded image before OCR.

### Acceptance Criteria

- Show image thumbnail
- Responsive display
- Replace image when new image is uploaded

---

## FR-004 Client-Side OCR

### Description

OCR processing runs entirely in the browser.

### OCR Engine

PaddleOCR WebAssembly (WASM)

### Acceptance Criteria

- No server request required
- Processing performed locally
- User data never leaves browser

---

## FR-005 OCR Result Display

### Description

Display extracted text in tabular format.

### Acceptance Criteria

- Editable cells
- Copyable content
- Scrollable table

---

## FR-006 Copy to Excel

### Description

Copy extracted data into clipboard in tab-separated format.

### Acceptance Criteria

- Single click copy
- Works with Microsoft Excel
- Works with Google Sheets

---

## FR-007 Export CSV

### Description

Export OCR results as CSV.

### Acceptance Criteria

- UTF-8 encoding
- Proper column separation

---

# UI Design

## Layout

Single-page application.

### Header

Logo

Title:
"OCR Screenshot to Excel"

---

### Main Area

#### Left Panel

Image Area

- Drag and drop zone
- Upload button
- Paste screenshot area
- Image preview

---

#### Right Panel

Results Area

Editable table

Actions:

- Copy to Excel
- Export CSV
- Clear Results

---

# UI Components

## Upload Zone

Text:

"Drop image here or click to upload"

---

## Paste Hint

Text:

"Press Ctrl+V to paste screenshot"

---

## OCR Status

States:

- Idle
- Processing...
- Completed
- Failed

---

## Results Table

Columns generated dynamically from OCR output.

---

# Technical Stack

## Framework

### Next.js 16

- App Router
- React 19
- TypeScript

---

## Styling

- Tailwind CSS v4

---

## OCR Engine

### PaddleOCR Web

Client-side only

Runs inside browser via WebAssembly.

---

## State Management

React Hooks

- useState
- useEffect

No Redux required.

---

## File Handling

Browser APIs

- File API
- Clipboard API

---

## CSV Export

Browser Blob API

---

## Clipboard Copy

Navigator Clipboard API

---

# Non-Functional Requirements

## Privacy

All processing occurs in browser.

No image upload.

No data storage.

No tracking.

---

## Performance

- Initial page load < 2 seconds
- OCR result < 5 seconds for normal screenshots

---

## Browser Support

- Chrome
- Edge
- Brave
- Safari
- Firefox

Latest versions only.

---

# MVP Screens

## Screen 1

Empty State

---

OCR Screenshot to Excel

[ Upload Image ]

or

Paste Screenshot (Ctrl+V)

---

---

## Screen 2

Processing State

---

Image Preview

Processing OCR...

Loading indicator

---

---

## Screen 3

Results State

---

Image Preview

Results Table

[ Copy to Excel ]

[ Export CSV ]

[ Clear ]

---

---

# Project Structure

app/

├── page.tsx

├── layout.tsx

├── globals.css

components/

├── UploadArea.tsx

├── ImagePreview.tsx

├── OCRResultTable.tsx

├── ActionButtons.tsx

hooks/

├── useClipboardPaste.ts

├── useOCR.ts

lib/

├── paddleocr.ts

types/

├── ocr.ts

---

# MVP Deliverable

A simple, single-page Next.js 16 application where users can:

1. Upload or paste a screenshot
2. Run OCR locally in the browser
3. View extracted text
4. Edit results
5. Copy directly into Excel
6. Export as CSV

No backend required.
