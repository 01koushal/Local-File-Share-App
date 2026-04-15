import axios from "axios";
import { useMemo, useState } from "react";

function resolveApiBaseUrl() {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  const hostname = window.location.hostname || "localhost";
  return `http://${hostname}:5000`;
}

function formatBytes(bytes) {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function fallbackCopyText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();

  const didCopy = document.execCommand("copy");
  document.body.removeChild(textArea);
  return didCopy;
}

export default function App() {
  const apiBaseUrl = useMemo(resolveApiBaseUrl, []);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [copyState, setCopyState] = useState("Copy link");

  const handleFileSelection = (file) => {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setDownloadUrl("");
    setError("");
    setUploadProgress(0);
    setCopyState("Copy link");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelection(event.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Choose a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    setError("");
    setDownloadUrl("");
    setCopyState("Copy link");

    try {
      const response = await axios.post(`${apiBaseUrl}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: (event) => {
          if (!event.total) {
            return;
          }

          const percent = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(percent);
        }
      });

      setDownloadUrl(response.data.downloadUrl);
      setUploadProgress(100);
    } catch (uploadError) {
      const message =
        uploadError.response?.data?.error ||
        "Upload failed. Please try again.";
      setError(message);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!downloadUrl) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(downloadUrl);
      } else {
        const didCopy = fallbackCopyText(downloadUrl);

        if (!didCopy) {
          throw new Error("Fallback copy failed");
        }
      }

      setCopyState("Copied");
    } catch (_error) {
      setCopyState("Copy failed");
    }
  };

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">Local File Share App</p>
        <h1>Drop a file and share it instantly.</h1>
        <p className="intro">
          Upload a file from your machine, then copy the generated download link.
        </p>

        <div
          className={`dropzone ${isDragging ? "dragging" : ""} ${
            selectedFile ? "has-file" : ""
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
        >
          <input
            id="file-input"
            className="file-input"
            type="file"
            onChange={(event) => handleFileSelection(event.target.files?.[0])}
          />
          <label htmlFor="file-input" className="dropzone-content">
            <span className="dropzone-title">
              {selectedFile ? selectedFile.name : "Drag and drop a file here"}
            </span>
            <span className="dropzone-subtitle">
              {selectedFile
                ? `${formatBytes(selectedFile.size)} selected`
                : "or click to browse"}
            </span>
          </label>
        </div>

        <button className="upload-button" onClick={handleUpload} disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload file"}
        </button>

        {(isUploading || uploadProgress > 0) && (
          <div className="progress-block" aria-live="polite">
            <div className="progress-label">
              <span>Upload progress</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-value" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {error && <p className="status error">{error}</p>}

        {downloadUrl && (
          <div className="result">
            <p className="status success">File uploaded successfully.</p>
            <a href={downloadUrl} target="_blank" rel="noreferrer">
              {downloadUrl}
            </a>
            <button className="copy-button" onClick={handleCopyLink}>
              {copyState}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
