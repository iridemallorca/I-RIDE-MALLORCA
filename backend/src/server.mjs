import cors from "cors";
import crypto from "node:crypto";
import express from "express";
import multer from "multer";
import nodemailer from "nodemailer";
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
const ownerEmail = process.env.OWNER_EMAIL || "iridemallorca@gmail.com";
const mailFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || ownerEmail;
const mailer = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => {
    done(null, /\.gpx$/i.test(file.originalname));
  },
});
const communityRateWindows = new Map();
const communityBlockedPatterns = [
  /(?:https?:\/\/|www\.)/i,
  /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/i,
  /(?:\+?\d[\d\s().-]{7,}\d)/,
  /\b(?:telegram|whatsapp)\s*(?:me|:+)?\s*\+?\d/i,
  /\b(?:crypto|forex|airdrop|giveaway)\b/i,
  /\b(?:kill yourself|kys)\b/i,
];

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
  // Azure Blob rejects URL-encoded metadata (the % character is not allowed).
  // Hex uses only letters and numbers, so accented names such as Deià remain safe.
  return `utf8_${Buffer.from(filename, "utf8").toString("hex")}`;
}

function filenameFromMetadata(value) {
  if (!value) return "route.gpx";
  if (value.startsWith("utf8_")) {
    try { return Buffer.from(value.slice(5), "hex").toString("utf8"); } catch { return "route.gpx"; }
  }
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jersey_orders (
      id UUID PRIMARY KEY,
      product_name TEXT NOT NULL,
      product_colour TEXT NOT NULL,
      product_price NUMERIC(10,2) NOT NULL,
      buyer_name TEXT NOT NULL,
      buyer_email TEXT NOT NULL,
      buyer_address TEXT NOT NULL,
      shipping_name TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      gender TEXT NOT NULL,
      jersey_size TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_messages (
      id UUID PRIMARY KEY,
      session_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      hidden_at TIMESTAMPTZ,
      hidden_reason TEXT
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS community_messages_visible_created_idx ON community_messages (created_at DESC) WHERE hidden_at IS NULL`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_message_reports (
      id UUID PRIMARY KEY,
      message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
      reporter_session_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(message_id, reporter_session_id)
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

function cleanOrderText(value, limit) {
  return String(value || "").trim().slice(0, limit);
}

function cleanCommunityText(value) {
  return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, 360);
}

function validCommunitySession(value) {
  return /^[a-z0-9_-]{8,64}$/i.test(String(value || ""));
}

function riderName(sessionId) {
  return `Rider ${sessionId.slice(-4).toUpperCase()}`;
}

function takeCommunityMessageSlot(sessionId) {
  const now = Date.now();
  if (communityRateWindows.size > 10_000) {
    for (const [key, timestamps] of communityRateWindows) {
      if (!timestamps.some((timestamp) => now - timestamp < 60_000)) communityRateWindows.delete(key);
    }
  }
  const current = (communityRateWindows.get(sessionId) || []).filter((timestamp) => now - timestamp < 60_000);
  if (current.length >= 3) return false;
  current.push(now);
  communityRateWindows.set(sessionId, current);
  return true;
}

async function sendOrderNotification(order) {
  if (!mailer) throw new Error("Order email is not configured.");

  const subject = `New I Ride Mallorca jersey order — ${order.productName}`;
  const text = [
    "A new jersey order request has been received.",
    "",
    `Jersey: ${order.productName}`,
    `Colour: ${order.productColour}`,
    `Price: €${order.productPrice.toFixed(2)}`,
    `Size: ${order.size}`,
    `Gender: ${order.gender}`,
    "",
    `Buyer: ${order.buyerName}`,
    `Email: ${order.buyerEmail}`,
    `Buyer address: ${order.buyerAddress}`,
    "",
    `Shipping name: ${order.shippingName}`,
    `Shipping address: ${order.shippingAddress}`,
  ].join("\n");

  await mailer.sendMail({
    from: mailFrom,
    to: ownerEmail,
    replyTo: order.buyerEmail,
    subject,
    text,
  });
}

app.post("/orders", async (req, res, next) => {
  try {
    const body = req.body || {};
    const productName = cleanOrderText(body.productName, 140);
    const productColour = cleanOrderText(body.productColour, 80);
    const productPrice = Number(body.productPrice);
    const buyerName = cleanOrderText(body.buyerName, 140);
    const buyerEmail = cleanOrderText(body.buyerEmail, 254).toLowerCase();
    const buyerAddress = cleanOrderText(body.buyerAddress, 500);
    const shippingName = cleanOrderText(body.shippingName, 140);
    const shippingAddress = cleanOrderText(body.shippingAddress, 500);
    const gender = cleanOrderText(body.gender, 20);
    const size = cleanOrderText(body.size, 10);

    if (
      !productName || !productColour || !Number.isFinite(productPrice) || productPrice <= 0 ||
      !buyerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail) ||
      !buyerAddress || !shippingName || !shippingAddress ||
      !["male", "female"].includes(gender) || !["XS", "S", "M", "L", "XL"].includes(size)
    ) {
      return res.status(400).json({ error: "Please complete all required order details." });
    }

    const order = {
      productName, productColour, productPrice, buyerName, buyerEmail, buyerAddress,
      shippingName, shippingAddress, gender, size,
    };
    await sendOrderNotification(order);

    const id = crypto.randomUUID();
    await pool.query(`
      INSERT INTO jersey_orders (
        id, product_name, product_colour, product_price, buyer_name, buyer_email,
        buyer_address, shipping_name, shipping_address, gender, jersey_size
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, [
      id, order.productName, order.productColour, order.productPrice, order.buyerName, order.buyerEmail,
      order.buyerAddress, order.shippingName, order.shippingAddress, order.gender, order.size,
    ]);

    res.status(201).json({ id, message: "Order request received." });
  } catch (error) {
    next(error);
  }
});

app.get("/community/messages", async (req, res, next) => {
  try {
    const requested = Number(req.query.limit);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), 100) : 100;
    const { rows } = await pool.query(`
      SELECT id, display_name, content, created_at
      FROM (
        SELECT id, display_name, content, created_at
        FROM community_messages
        WHERE hidden_at IS NULL
        ORDER BY created_at DESC
        LIMIT $1
      ) AS recent_messages
      ORDER BY created_at ASC
    `, [limit]);
    res.json(rows.map((message) => ({ id: message.id, user: message.display_name, content: message.content, ts: message.created_at })));
  } catch (error) {
    next(error);
  }
});

app.post("/community/messages", async (req, res, next) => {
  try {
    const sessionId = String(req.body?.sessionId || "");
    const content = cleanCommunityText(req.body?.content);
    if (!validCommunitySession(sessionId)) return res.status(400).json({ error: "Please refresh the page and try again." });
    if (content.length < 2) return res.status(400).json({ error: "Please write a message of at least two characters." });
    if (communityBlockedPatterns.some((pattern) => pattern.test(content))) {
      return res.status(400).json({ error: "For everyone’s safety, messages cannot include links, contact details, spam or harmful language." });
    }
    if (!takeCommunityMessageSlot(sessionId)) return res.status(429).json({ error: "Please wait a moment before sending another message." });

    const duplicate = await pool.query(`
      SELECT 1 FROM community_messages
      WHERE session_id = $1 AND content = $2 AND created_at > NOW() - INTERVAL '10 minutes'
      LIMIT 1
    `, [sessionId, content]);
    if (duplicate.rowCount) return res.status(409).json({ error: "That message was already shared recently." });

    const id = crypto.randomUUID();
    const { rows } = await pool.query(`
      INSERT INTO community_messages (id, session_id, display_name, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id, display_name, content, created_at
    `, [id, sessionId, riderName(sessionId), content]);
    const message = rows[0];
    res.status(201).json({ id: message.id, user: message.display_name, content: message.content, ts: message.created_at });
  } catch (error) {
    next(error);
  }
});

app.post("/community/messages/:id/report", async (req, res, next) => {
  try {
    const messageId = String(req.params.id || "");
    const sessionId = String(req.body?.sessionId || "");
    const reason = cleanCommunityText(req.body?.reason || "Community member report").slice(0, 160);
    if (!/^[a-f0-9-]{36}$/i.test(messageId) || !validCommunitySession(sessionId)) return res.status(400).json({ error: "The report could not be processed." });
    const reported = await pool.query(`
      INSERT INTO community_message_reports (id, message_id, reporter_session_id, reason)
      SELECT $1, id, $2, $3 FROM community_messages WHERE id = $4
      ON CONFLICT (message_id, reporter_session_id) DO NOTHING
      RETURNING message_id
    `, [crypto.randomUUID(), sessionId, reason || "Community member report", messageId]);
    if (!reported.rowCount) {
      const exists = await pool.query("SELECT 1 FROM community_messages WHERE id = $1", [messageId]);
      if (!exists.rowCount) return res.status(404).json({ error: "Message not found." });
      return res.status(409).json({ error: "You have already reported this message." });
    }
    const countResult = await pool.query("SELECT COUNT(*)::int AS count FROM community_message_reports WHERE message_id = $1", [messageId]);
    const reportCount = countResult.rows[0].count;
    const hidden = reportCount >= 3;
    if (hidden) await pool.query("UPDATE community_messages SET hidden_at = COALESCE(hidden_at, NOW()), hidden_reason = COALESCE(hidden_reason, 'Community reports') WHERE id = $1", [messageId]);
    res.status(201).json({ hidden, reportCount });
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
