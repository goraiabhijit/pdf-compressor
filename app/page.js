"use client";
import { useRef, useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const engineLoadPromise = useRef(null);

  const loadGhostscript = () => {
    if (window.ghostscript) return Promise.resolve(window.ghostscript);
    if (engineLoadPromise.current) return engineLoadPromise.current;

    engineLoadPromise.current = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.type = "module";
      script.textContent = `
        try {
          const { default: initGhostscript } = await import("https://cdn.jsdelivr.net/npm/@jspawn/ghostscript-wasm@0.0.2/gs.mjs");
          window.ghostscript = await initGhostscript({
            locateFile: file =>
              \`https://cdn.jsdelivr.net/npm/@jspawn/ghostscript-wasm@0.0.2/\${file}\`
          });
          window.dispatchEvent(new Event("ghostscript-ready"));
        } catch (error) {
          window.dispatchEvent(new CustomEvent("ghostscript-error", { detail: error }));
        }
      `;

      const cleanup = () => {
        window.removeEventListener("ghostscript-ready", handleReady);
        window.removeEventListener("ghostscript-error", handleError);
      };
      const handleReady = () => {
        cleanup();
        resolve(window.ghostscript);
      };
      const handleError = (event) => {
        cleanup();
        engineLoadPromise.current = null;
        reject(event.detail ?? new Error("Ghostscript failed to load."));
      };

      window.addEventListener("ghostscript-ready", handleReady);
      window.addEventListener("ghostscript-error", handleError);
      document.body.appendChild(script);
    });

    return engineLoadPromise.current;
  };

  const countPdfPages = async (pdfFile) => {
    const bytes = new Uint8Array(await pdfFile.arrayBuffer());
    const pdfText = new TextDecoder("latin1").decode(bytes);
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
    return Math.max(pageMatches?.length ?? 1, 1);
  };

  const compress = async () => {
    if (!file) return;

    setIsCompressing(true);
    setMessage("");

    try {
      const ghostscript = await loadGhostscript();
      const totalPages = await countPdfPages(file);
      const buffer = await file.arrayBuffer();

      ghostscript.FS.writeFile("input.pdf", new Uint8Array(buffer));
      setProgress({ current: 0, total: totalPages });
      await new Promise((resolve) => requestAnimationFrame(resolve));

      for (let page = 1; page <= totalPages; page += 1) {
        ghostscript.callMain([
          "-sDEVICE=pdfwrite",
          "-dPDFSETTINGS=/ebook",
          "-dNOPAUSE",
          "-dBATCH",
          `-dFirstPage=${page}`,
          `-dLastPage=${page}`,
          `-sOutputFile=page-${page}.pdf`,
          "input.pdf",
        ]);
        setProgress({ current: page, total: totalPages });
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      ghostscript.callMain([
        "-sDEVICE=pdfwrite",
        "-dNOPAUSE",
        "-dBATCH",
        "-sOutputFile=output.pdf",
        ...Array.from(
          { length: totalPages },
          (_, index) => `page-${index + 1}.pdf`,
        ),
      ]);

      const output = ghostscript.FS.readFile("output.pdf");

      const pdfBlob = new Blob([output], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "compressed.pdf";
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Your compressed PDF is ready.");
    } catch (error) {
      console.error(error);
      setMessage("Compression failed. Please try again.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setMessage("");
    setProgress({ current: 0, total: 0 });
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ↗
          </span>
          Paperlight
        </div>
        <span className="topbar-note">PRIVATE · IN-BROWSER PROCESSING</span>
      </header>
      <section className="compressor-card" aria-labelledby="page-title">
        <div className="card-heading">
          <div className="eyebrow">PDF TOOL</div>
          <h1 id="page-title">Make your PDF smaller.</h1>
          <p className="intro">
            A simple way to reduce file size while keeping your document sharp.
          </p>
        </div>

        <label className="file-picker">
          <span className="upload-icon" aria-hidden="true">
            ↑
          </span>
          <span className="file-picker-copy">
            <strong>{file ? file.name : "Choose a PDF file"}</strong>
            <small>
              {file
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                : "PDF files only"}
            </small>
          </span>
          <span className="browse-label">Browse</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
          />
        </label>

        <p className="performance-note">
          <strong>Best for smaller PDFs.</strong> Ghostscript runs in your
          browser with WebAssembly, so compression can be slower for larger
          files. PDFs under 10 pages are recommended.
        </p>

        <div className="actions">
          <button
            className="primary-button"
            onClick={compress}
            disabled={!file || isCompressing}
            type="button"
          >
            {isCompressing ? "Compressing..." : "Compress PDF"}
          </button>
        </div>

        {progress.total > 0 && (
          <div className="progress-area" aria-live="polite">
            <div className="progress-label">
              <span>
                {isCompressing ? "Compressing pages" : "Compression complete"}
              </span>
              <span>
                {progress.current} / {progress.total}
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax={progress.total}
              aria-valuenow={progress.current}
            >
              <div
                className="progress-bar"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {message && (
          <p className="status-message" role="status">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
