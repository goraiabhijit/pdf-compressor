## Paperlight PDF Compressor

A browser-based PDF compressor built with Next.js and Ghostscript WebAssembly.
Select a PDF, start compression, and download the smaller file without uploading
the document to a server.

## Features

- Compresses PDFs directly in the browser
- Uses Ghostscript WebAssembly with the `ebook` PDF quality preset
- Shows progress as pages are processed
- Downloads the result as `compressed.pdf`
- Does not require a backend or file upload service

## Requirements

- Node.js 18.18 or newer
- A modern browser with WebAssembly support
- An internet connection the first time Ghostscript is loaded from jsDelivr

## Getting Started

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

For a production build:

```bash
npm run build
npm start
```

## Usage

1. Choose a PDF file.
2. Select **Compress PDF**.
3. Wait for the page progress bar to finish.
4. The compressed PDF downloads automatically.

Ghostscript loads automatically when compression starts. The PDF is processed
in the browser, so the original file is not sent to an application server.

## Performance Note

Ghostscript WebAssembly is powerful, but running it in the browser is slower
than running native Ghostscript on a server or desktop. Compression is performed
page by page, which allows the progress bar to show completed pages but can take
some time for larger documents.

For the best experience, use PDFs with **fewer than 10 pages**. Larger PDFs may
take significantly longer, use more browser memory, and make the browser appear
unresponsive while each page is being compressed.

The application currently uses Ghostscript's `/ebook` preset, which balances
file size and document quality. Compression results depend on the PDF's images,
fonts, and existing compression.

## Scripts

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the development server |
| `npm run lint`  | Run ESLint                   |
| `npm run build` | Create a production build    |
| `npm start`     | Start the production server  |

## Technology

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Ghostscript WebAssembly](https://github.com/jspawn/ghostscript-wasm)
- [Tailwind CSS](https://tailwindcss.com/)
