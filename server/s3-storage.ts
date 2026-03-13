import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";

// ─── S3 Client ────────────────────────────────────────────────────────────────

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "snapty-storage";
const SIGNED_URL_EXPIRY = 24 * 60 * 60; // 24 hours

// ─── Key builders ─────────────────────────────────────────────────────────────
// Folder structure:
//   bookings/{bookingId}/raw/photographer_{photographerUserId}/{filename}
//   bookings/{bookingId}/edited/editor_{editorUserId}/{filename}
//   bookings/{bookingId}/edited/editor_{editorUserId}/thumbnails/{filename}

export function buildRawKey(bookingId: number, photographerUserId: number, filename: string) {
  return `bookings/${bookingId}/raw/photographer_${photographerUserId}/${filename}`;
}
export function buildEditedKey(bookingId: number, editorUserId: number, filename: string) {
  return `bookings/${bookingId}/edited/editor_${editorUserId}/${filename}`;
}
export function buildThumbnailKey(bookingId: number, editorUserId: number, filename: string) {
  return `bookings/${bookingId}/edited/editor_${editorUserId}/thumbnails/${filename}`;
}
export function buildRawPrefix(bookingId: number, photographerUserId: number) {
  return `bookings/${bookingId}/raw/photographer_${photographerUserId}/`;
}
export function buildEditedPrefix(bookingId: number, editorUserId: number) {
  return `bookings/${bookingId}/edited/editor_${editorUserId}/`;
}

// ─── Real authorization validators ────────────────────────────────────────────

export function checkPhotographerOwnership(
  bookingPhotographerId: number | null | undefined,
  photographerRowId: number
): boolean {
  if (!bookingPhotographerId) return false;
  return bookingPhotographerId === photographerRowId;
}

export function checkEditorAssignment(
  bookingEditorId: number | null | undefined,
  editorUserId: number
): boolean {
  if (!bookingEditorId) return false;
  return bookingEditorId === editorUserId;
}

export function checkClientOwnership(
  bookingClientId: number,
  clientUserId: number
): boolean {
  return bookingClientId === clientUserId;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadRawPhoto(
  bookingId: number,
  photographerUserId: number,
  filename: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  const key = buildRawKey(bookingId, photographerUserId, filename);
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME, Key: key, Body: fileBuffer, ContentType: contentType,
    Metadata: { "booking-id": bookingId.toString(), "photographer-user-id": photographerUserId.toString(), "upload-type": "raw", "upload-date": new Date().toISOString() },
  }));
  return { key, url: `s3://${BUCKET_NAME}/${key}` };
}

export async function uploadEditedPhoto(
  bookingId: number,
  editorUserId: number,
  filename: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ key: string; url: string; thumbnailKey: string }> {
  const key = buildEditedKey(bookingId, editorUserId, filename);
  const thumbnailKey = buildThumbnailKey(bookingId, editorUserId, filename);

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME, Key: key, Body: fileBuffer, ContentType: contentType,
    Metadata: { "booking-id": bookingId.toString(), "editor-user-id": editorUserId.toString(), "upload-type": "edited", "upload-date": new Date().toISOString() },
  }));

  try {
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize(500, 500, { fit: "cover", position: "center" })
      .jpeg({ quality: 80 }).toBuffer();
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME, Key: thumbnailKey, Body: thumbnailBuffer, ContentType: "image/jpeg",
      Metadata: { "booking-id": bookingId.toString(), "editor-user-id": editorUserId.toString(), "upload-type": "thumbnail", "upload-date": new Date().toISOString() },
    }));
  } catch (err) {
    console.error("Thumbnail generation failed:", err);
  }

  return { key, url: `s3://${BUCKET_NAME}/${key}`, thumbnailKey };
}

// ─── Signed URL ───────────────────────────────────────────────────────────────

export async function generateSignedUrl(key: string, expirySeconds: number = SIGNED_URL_EXPIRY): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: expirySeconds });
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listFiles(prefix: string): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
  const response = await s3Client.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: prefix }));
  return (response.Contents ?? []).filter((o) => o.Key !== prefix).map((o) => ({
    key: o.Key || "", size: o.Size || 0, lastModified: o.LastModified || new Date(),
  }));
}

// ─── Role-based getters ───────────────────────────────────────────────────────

export async function getPhotographerRawPhotos(bookingId: number, photographerUserId: number) {
  const prefix = buildRawPrefix(bookingId, photographerUserId);
  const files = await listFiles(prefix);
  return Promise.all(files.map(async (f) => {
    const filename = f.key.split("/").pop() || "";
    const url = await generateSignedUrl(f.key);
    return { filename, key: f.key, url, size: f.size };
  }));
}

export async function getEditorRawPhotos(bookingId: number) {
  const prefix = `bookings/${bookingId}/raw/`;
  const files = (await listFiles(prefix)).filter((f) => !f.key.includes("/thumbnails/"));
  return Promise.all(files.map(async (f) => {
    const parts = f.key.split("/");
    const filename = parts.pop() || "";
    const photographerFolder = parts.find((p) => p.startsWith("photographer_")) || "";
    const photographerUserId = photographerFolder.replace("photographer_", "");
    const url = await generateSignedUrl(f.key);
    return { filename, key: f.key, url, size: f.size, photographerUserId };
  }));
}

export async function getClientGallery(bookingId: number, editorUserId: number) {
  const prefix = buildEditedPrefix(bookingId, editorUserId);
  const files = (await listFiles(prefix)).filter((f) => !f.key.includes("/thumbnails/"));
  return Promise.all(files.map(async (f) => {
    const filename = f.key.split("/").pop() || "";
    const thumbnailKey = buildThumbnailKey(bookingId, editorUserId, filename);
    const [url, thumbnailUrl] = await Promise.all([
      generateSignedUrl(f.key),
      generateSignedUrl(thumbnailKey).catch(() => generateSignedUrl(f.key)),
    ]);
    return { filename, key: f.key, url, thumbnailUrl, size: f.size };
  }));
}

export async function getAdminBookingFiles(bookingId: number) {
  const prefix = `bookings/${bookingId}/`;
  const files = await listFiles(prefix);
  return Promise.all(files.map(async (f) => {
    const parts = f.key.split("/");
    const filename = parts.pop() || "";
    const folder = parts.slice(2).join("/");
    const url = await generateSignedUrl(f.key);
    return { filename, key: f.key, url, size: f.size, folder };
  }));
}

export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
}
