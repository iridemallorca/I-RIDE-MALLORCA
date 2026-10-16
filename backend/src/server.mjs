import cors from "cors";
import crypto from "node:crypto";
import express from "express";
import multer from "multer";
import pg from "pg";
import { BlobServiceClient } from "@azure/storage-blob";

const required = ["DATABASE_URL", "AZURE_STORAGE_CONNECTION_STRING"];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`);
}

const app = express();
const port = Number(process.env.PORT || 8080);
const containerName = process.env.GPX_CONTAINER || process.env.AZURE_STORAGE_CONTAINER || "gpx";
const configuredOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  "https://www.iridemallorca.com",
  "https://iridemallorca.com",
  ...configuredOrigins,
]);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PG_SSL === "false" ? false : { rejectUnauthorized: false },
});

const blobService = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const container = blobService.getContainerClient(containerName);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => {
    done(null, /\.gpx$/i.test(file.originalname));
  },
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed"));
  },
}));
app.use(express.json({ limit: "1mb" }));

function publicDownloadUrl(req, blobName) {
  return `${req.protocol}://${req.get("host")}/gpx/download/${encodeURIComponent(blobName)}`;
}

function safeBlobName(value) {
  return /^[a-f0-9-]{36}\.gpx$/i.test(value || "");
}

function filenameMetadata(filename) {
  // Azure Blob metadata is restricted to ASCII. Keep the original filename
  // encoded so routes named with accents (for example, Deià) can be uploaded.
  return encodeURIComponent(filename).slice(0, 200);
}

function filenameFromMetadata(value) {
  if (!value) return "route.gpx";
  try { return decodeURIComponent(value); } catch { return value; }
}

function contentDisposition(filename) {
  const safeFilename = filename
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[^\w. ()-]/g, "_")
    .replace(/"/g, "")
    .slice(0, 180) || "route.gpx";
  const encodedFilename = encodeURIComponent(filename).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`;
}

async function initialise() {
  await container.createIfNotExists();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tracks (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      blob_name TEXT NOT NULL UNIQUE,
      distance_km DOUBLE PRECISION NOT NULL,
      elevation_gain_m INTEGER NOT NULL,
      svg_path TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

app.get("/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/gpx/upload", upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Please choose a .gpx file up to 10 MB." });

    const sample = file.buffer.subarray(0, 4096).toString("utf8");
    if (!/<gpx(?:\s|>)/i.test(sample)) {
      return res.status(400).json({ error: "The selected file is not a valid GPX file." });
    }

    const blobName = `${crypto.randomUUID()}.gpx`;
    const client = container.getBlockBlobClient(blobName);
    await client.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: "application/gpx+xml",
        blobContentDisposition: contentDisposition(file.originalname),
      },
      metadata: { originalname: filenameMetadata(file.originalname) },
    });

    res.status(201).json({ blobName, downloadUrl: `/gpx/download/${encodeURIComponent(blobName)}` });
  } catch (error) {
    next(error);
  }
});

app.get("/gpx/download/:blobName", async (req, res, next) => {
  try {
    const { blobName } = req.params;
    if (!safeBlobName(blobName)) return res.status(404).end();

    const client = container.getBlockBlobClient(blobName);
    const response = await client.download();
    if (!response.readableStreamBody) return res.status(404).end();

    const originalName = filenameFromMetadata((await client.getProperties()).metadata?.originalname);
    res.setHeader("Content-Type", "application/gpx+xml");
    res.setHeader("Content-Disposition", contentDisposition(originalName));
    response.readableStreamBody.pipe(res);
  } catch (error) {
    if (error.statusCode === 404) return res.status(404).end();
    next(error);
  }
});

app.get("/tracks", async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, title, blob_name, distance_km, elevation_gain_m, svg_path, created_at
      FROM tracks
      ORDER BY created_at DESC
    `);
    res.json(rows.map((track) => ({
      id: track.id,
      title: track.title,
      storageUrl: publicDownloadUrl(req, track.blob_name),
      distanceKm: track.distance_km,
      elevationGainM: track.elevation_gain_m,
      svgPath: track.svg_path,
      createdAt: track.created_at,
    })));
  } catch (error) {
    next(error);
  }
});

app.post("/tracks", async (req, res, next) => {
  try {
    const { title, storageUrl, distanceKm, elevationGainM, svgPath = null } = req.body || {};
    const blobName = String(storageUrl || "").split("?")[0].split("/").filter(Boolean).pop();
    if (!title || !safeBlobName(blobName) || !Number.isFinite(distanceKm) || !Number.isFinite(elevationGainM)) {
      return res.status(400).json({ error: "The track details are incomplete or invalid." });
    }

    const id = crypto.randomUUID();
    const { rows } = await pool.query(`
      INSERT INTO tracks (id, title, blob_name, distance_km, elevation_gain_m, svg_path)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, blob_name, distance_km, elevation_gain_m, svg_path, created_at
    `, [id, String(title).slice(0, 140), blobName, distanceKm, Math.round(elevationGainM), svgPath]);

    const track = rows[0];
    res.status(201).json({
      id: track.id,
      title: track.title,
      storageUrl: publicDownloadUrl(req, track.blob_name),
      distanceKm: track.distance_km,
      elevationGainM: track.elevation_gain_m,
      svgPath: track.svg_path,
      createdAt: track.created_at,
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, _next) => {
  if (error instanceof multer.MulterError) return res.status(400).json({ error: "The GPX upload must be smaller than 10 MB." });
  console.error(error);

  const operation = req.path === "/gpx/upload"
    ? "upload"
    : req.path === "/tracks"
      ? "track-save"
      : "request";

  const message = operation === "upload"
    ? "The GPX file could not be uploaded to route storage."
    : operation === "track-save"
      ? "The GPX file was uploaded, but the route details could not be saved."
      : "The GPX service could not complete this request.";

  res.status(500).json({ error: message });
});

initialise()
  .then(() => app.listen(port, () => console.log(`I Ride Mallorca API listening on port ${port}`)))
  .catch((error) => {
    console.error("Unable to initialise the API", error);
    process.exit(1);
  });
