import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export type MediaKind = 'image' | 'audio';

type ParsedMedia = {
  bytes: Buffer;
  mimeType: string;
  extension: string;
};

type StoredMedia = {
  storageReference: string;
  mimeType: string;
  fileSize: number;
};

const MIME_TYPES: Record<MediaKind, Record<string, string>> = {
  image: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  },
  audio: {
    'audio/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
  },
};

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function maximumBytes(kind: MediaKind): number {
  return kind === 'image'
    ? positiveInteger(process.env.MEDIA_MAX_IMAGE_BYTES, 10 * 1024 * 1024)
    : positiveInteger(process.env.MEDIA_MAX_AUDIO_BYTES, 25 * 1024 * 1024);
}

function hasExpectedSignature(bytes: Buffer, mimeType: string): boolean {
  const ascii = (start: number, end: number) => bytes.subarray(start, end).toString('ascii');
  switch (mimeType) {
    case 'image/jpeg':
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case 'image/png':
      return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/webp':
      return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
    case 'audio/webm':
      return bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    case 'audio/mpeg':
      return ascii(0, 3) === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
    case 'audio/mp4':
      return ascii(4, 8) === 'ftyp';
    case 'audio/ogg':
      return ascii(0, 4) === 'OggS';
    case 'audio/wav':
      return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE';
    default:
      return false;
  }
}

export function parseMediaDataUrl(dataUrl: string, kind: MediaKind): ParsedMedia {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(dataUrl);
  if (!match) throw new Error('INVALID_MEDIA_DATA_URL');

  const mimeType = match[1].toLowerCase();
  const extension = MIME_TYPES[kind][mimeType];
  if (!extension) throw new Error('UNSUPPORTED_MEDIA_TYPE');

  const encoded = match[2].replace(/[\r\n]/g, '');
  if (encoded.length > Math.ceil((maximumBytes(kind) * 4) / 3) + 4) {
    throw new Error('MEDIA_TOO_LARGE');
  }
  const bytes = Buffer.from(encoded, 'base64');
  const canonicalInput = encoded.replace(/=+$/, '');
  const canonicalDecoded = bytes.toString('base64').replace(/=+$/, '');
  if (!bytes.length || canonicalInput !== canonicalDecoded) {
    throw new Error('INVALID_MEDIA_ENCODING');
  }
  if (bytes.length > maximumBytes(kind)) throw new Error('MEDIA_TOO_LARGE');
  if (!hasExpectedSignature(bytes, mimeType)) throw new Error('MEDIA_SIGNATURE_MISMATCH');

  return { bytes, mimeType, extension };
}

function getStorageConfig() {
  const url = process.env.SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_MEDIA_BUCKET || 'pilot-media';

  if (!url || !secretKey) {
    throw new Error(
      'CRITICAL_MEDIA_STORAGE_CONFIG_MISSING: SUPABASE_URL and a server-only Supabase secret key are required.'
    );
  }

  return { url, secretKey, bucket };
}

function storageClient() {
  const { url, secretKey } = getStorageConfig();
  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function hasMediaStorageConfig(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function validatePrivateMediaBucket(
  expectedBucket: string,
  bucket: { id?: string; name?: string; public?: boolean } | null
): void {
  if (!bucket || (bucket.id !== expectedBucket && bucket.name !== expectedBucket)) {
    throw new Error(`MEDIA_BUCKET_NOT_FOUND: ${expectedBucket}`);
  }
  if (bucket.public) throw new Error(`MEDIA_BUCKET_MUST_BE_PRIVATE: ${expectedBucket}`);
}

export async function assertMediaStorageReady(): Promise<void> {
  const { bucket } = getStorageConfig();
  const { data, error } = await storageClient().storage.getBucket(bucket);
  if (error) throw new Error(`MEDIA_BUCKET_CHECK_FAILED: ${error.message}`);
  validatePrivateMediaBucket(bucket, data);
}

export function buildStorageReference(bucket: string, objectPath: string): string {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(bucket)) throw new Error('INVALID_STORAGE_BUCKET');
  if (!objectPath || objectPath.startsWith('/') || objectPath.split('/').includes('..')) {
    throw new Error('INVALID_STORAGE_PATH');
  }
  return `supabase://${bucket}/${objectPath}`;
}

export function parseStorageReference(reference: string): { bucket: string; objectPath: string } {
  const match = /^supabase:\/\/([a-z0-9][a-z0-9_-]*)\/(.+)$/i.exec(reference);
  if (!match || reference.includes('?') || reference.includes('#')) {
    throw new Error('INVALID_STORAGE_REFERENCE');
  }

  let objectPath: string;
  try {
    objectPath = decodeURIComponent(match[2]);
  } catch {
    throw new Error('INVALID_STORAGE_REFERENCE');
  }

  const bucket = match[1];
  if (!objectPath || objectPath.startsWith('/') || objectPath.split('/').includes('..')) {
    throw new Error('INVALID_STORAGE_REFERENCE');
  }
  return { bucket, objectPath };
}

export async function uploadStudentMedia(input: {
  attemptId: string;
  studentResponseId: string;
  kind: MediaKind;
  dataUrl: string;
}): Promise<StoredMedia> {
  const media = parseMediaDataUrl(input.dataUrl, input.kind);
  const { bucket } = getStorageConfig();
  const objectPath = [
    'attempts',
    encodeURIComponent(input.attemptId),
    'responses',
    encodeURIComponent(input.studentResponseId),
    `${randomUUID()}.${media.extension}`,
  ].join('/');

  const { error } = await storageClient()
    .storage.from(bucket)
    .upload(objectPath, media.bytes, {
      cacheControl: '0',
      contentType: media.mimeType,
      upsert: false,
    });
  if (error) throw new Error(`MEDIA_UPLOAD_FAILED: ${error.message}`);

  return {
    storageReference: buildStorageReference(bucket, objectPath),
    mimeType: media.mimeType,
    fileSize: media.bytes.length,
  };
}

export async function createSignedMediaUrl(storageReference: string): Promise<string> {
  const { bucket, objectPath } = parseStorageReference(storageReference);
  const ttlSeconds = Math.min(
    positiveInteger(process.env.MEDIA_SIGNED_URL_TTL_SECONDS, 300),
    600
  );
  const { data, error } = await storageClient()
    .storage.from(bucket)
    .createSignedUrl(objectPath, ttlSeconds);
  if (error || !data?.signedUrl) {
    throw new Error(`MEDIA_SIGNING_FAILED: ${error?.message || 'signed URL missing'}`);
  }
  return data.signedUrl;
}

export async function downloadStoredMediaAsDataUrl(
  storageReference: string,
  fallbackMimeType: string
): Promise<string> {
  const { bucket, objectPath } = parseStorageReference(storageReference);
  const { data, error } = await storageClient().storage.from(bucket).download(objectPath);
  if (error || !data) throw new Error(`MEDIA_DOWNLOAD_FAILED: ${error?.message || 'empty body'}`);

  const mimeType = data.type || fallbackMimeType;
  const bytes = Buffer.from(await data.arrayBuffer());
  return `data:${mimeType};base64,${bytes.toString('base64')}`;
}

export async function deleteStoredMedia(storageReference: string): Promise<void> {
  const { bucket, objectPath } = parseStorageReference(storageReference);
  const { error } = await storageClient().storage.from(bucket).remove([objectPath]);
  if (error) throw new Error(`MEDIA_DELETE_FAILED: ${error.message}`);
}
