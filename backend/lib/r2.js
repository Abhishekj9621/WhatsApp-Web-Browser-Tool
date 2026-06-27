// lib/r2.js  –  Cloudflare R2 via AWS SDK v3 (S3-compatible)
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const crypto = require('crypto');

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');

/**
 * Upload a buffer or stream to R2.
 * Returns the public URL of the uploaded file.
 */
async function uploadToR2(buffer, originalname, mimetype) {
  const ext = path.extname(originalname).toLowerCase();
  const key = `uploads/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  const url = `${PUBLIC_URL}/${key}`;
  return { key, url };
}

/**
 * Delete a file from R2 by its key.
 */
async function deleteFromR2(key) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

/**
 * Generate a temporary signed GET URL (for private buckets).
 * Default expiry: 1 hour.
 */
async function getSignedDownloadUrl(key, expiresIn = 3600) {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

module.exports = { uploadToR2, deleteFromR2, getSignedDownloadUrl };
