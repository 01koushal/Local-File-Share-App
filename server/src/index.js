const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const uploadsDir = path.join(__dirname, "..", "uploads");
const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB) || 10;

fs.mkdirSync(uploadsDir, { recursive: true });

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim())
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        !allowedOrigins ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("CORS is not allowed for this origin."));
    }
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-");
    callback(null, `${Date.now()}-${baseName}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeMb * 1024 * 1024
  }
});

function getBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL;
  }

  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol;
  const host = req.get("x-forwarded-host") || req.get("host");

  return `${protocol}://${host}`;
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const downloadUrl = `${getBaseUrl(req)}/files/${encodeURIComponent(
    req.file.filename
  )}`;

  return res.status(201).json({
    message: "File uploaded successfully.",
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    downloadUrl
  });
});

app.get("/files/:filename", (req, res) => {
  const requestedFile = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, requestedFile);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found." });
  }

  return res.download(filePath, requestedFile);
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: `File is too large. Maximum size is ${maxFileSizeMb}MB.` });
    }

    return res.status(400).json({ error: err.message });
  }

  if (err) {
    return res.status(500).json({ error: "Something went wrong on the server." });
  }

  return res.status(500).json({ error: "Unexpected server error." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
