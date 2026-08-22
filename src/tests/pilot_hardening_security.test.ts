import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateAttemptToken, hashAttemptToken } from '../lib/attemptTokens';
import {
  buildStorageReference,
  hasMediaStorageConfig,
  parseMediaDataUrl,
  parseStorageReference,
  validatePrivateMediaBucket,
} from '../lib/mediaStorage';
import {
  computeRetryDelayMs,
  isProcessingWorkerAuthorized,
} from '../lib/durableProcessingQueue';
import { selectAudioRecordingMimeType } from '../lib/browserMediaRecorder';
import {
  allowsEphemeralPreviewAuthSecret,
  generateEphemeralPreviewAuthSecret,
  requiresGoogleAuthConfig,
} from '../lib/authEnvironment';

describe('pilot hardening security primitives', () => {
  it('keeps the additive pilot migration free of duplicate enum creation', () => {
    const initMigration = readFileSync(
      resolve('prisma/migrations/20260806000000_init/migration.sql'),
      'utf8'
    );
    const pilotMigration = readFileSync(
      resolve('prisma/migrations/20260814000000_pilot_media_tokens_queue/migration.sql'),
      'utf8'
    );
    const createdTypes = (sql: string) =>
      new Set(Array.from(sql.matchAll(/CREATE TYPE "([^"]+)"/g), (match) => match[1]));
    const initTypes = createdTypes(initMigration);
    const duplicateTypes = [...createdTypes(pilotMigration)].filter((type) => initTypes.has(type));

    expect(duplicateTypes).toEqual([]);
  });

  it('closes every pilot table to Supabase browser roles with RLS', () => {
    const rlsMigration = readFileSync(
      resolve('prisma/migrations/20260814170000_secure_public_schema_rls/migration.sql'),
      'utf8'
    );
    const protectedTables = Array.from(
      rlsMigration.matchAll(/ALTER TABLE public\."([^"]+)" ENABLE ROW LEVEL SECURITY;/g),
      (match) => match[1]
    );

    expect(new Set(protectedTables).size).toBe(50);
    expect(protectedTables).toEqual(
      expect.arrayContaining([
        'User',
        'Session',
        'ExamAttempt',
        'ResponseProcessingJob',
        '_prisma_migrations',
      ])
    );
    expect(rlsMigration).toContain(
      "FOREACH target_role IN ARRAY ARRAY['anon', 'authenticated']"
    );
    expect(rlsMigration).toContain(
      'IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target_role)'
    );
    const protectedTableList = rlsMigration.match(
      /protected_tables constant text\[\] := ARRAY\[([\s\S]*?)\];/
    );
    expect(protectedTableList).not.toBeNull();
    const revokedTables = Array.from(
      protectedTableList![1].matchAll(/'([^']+)'/g),
      (match) => match[1]
    );
    expect(revokedTables).toEqual(protectedTables);
    expect(rlsMigration).toContain(
      'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM %I'
    );
    expect(rlsMigration).not.toMatch(/FROM anon, authenticated/i);
    expect(rlsMigration).not.toMatch(/CREATE POLICY/i);
    expect(rlsMigration).toContain(
      'REVOKE EXECUTE ON FUNCTION public.yeni_kullanici_profili() FROM PUBLIC'
    );
  });

  it('requires Google OAuth for real production but keeps previews fail-closed', () => {
    expect(requiresGoogleAuthConfig({ NODE_ENV: 'production' })).toBe(true);
    expect(
      requiresGoogleAuthConfig({ NODE_ENV: 'production', VERCEL_ENV: 'production' })
    ).toBe(true);
    expect(
      requiresGoogleAuthConfig({ NODE_ENV: 'production', VERCEL_ENV: 'preview' })
    ).toBe(false);
    expect(requiresGoogleAuthConfig({ NODE_ENV: 'development' })).toBe(false);
    expect(
      allowsEphemeralPreviewAuthSecret(
        { NODE_ENV: 'production', VERCEL_ENV: 'preview' },
        false
      )
    ).toBe(true);
    expect(
      allowsEphemeralPreviewAuthSecret(
        { NODE_ENV: 'production', VERCEL_ENV: 'preview' },
        true
      )
    ).toBe(false);
    expect(
      allowsEphemeralPreviewAuthSecret(
        { NODE_ENV: 'production', VERCEL_ENV: 'production' },
        false
      )
    ).toBe(false);

    const firstPreviewSecret = generateEphemeralPreviewAuthSecret();
    const secondPreviewSecret = generateEphemeralPreviewAuthSecret();
    expect(firstPreviewSecret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(secondPreviewSecret).not.toBe(firstPreviewSecret);
  });

  it('generates high-entropy attempt tokens and stores deterministic hashes', () => {
    const first = generateAttemptToken();
    const second = generateAttemptToken();

    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(hashAttemptToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashAttemptToken(first)).toBe(hashAttemptToken(first));
    expect(hashAttemptToken(first)).not.toBe(hashAttemptToken(second));
    expect(() => hashAttemptToken('')).toThrow('INVALID_ATTEMPT_TOKEN');
  });

  it('accepts only allow-listed, bounded base64 media', () => {
    const pngBytes = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.from('test-payload'),
    ]);
    const parsed = parseMediaDataUrl(`data:image/png;base64,${pngBytes.toString('base64')}`, 'image');
    expect(parsed.mimeType).toBe('image/png');
    expect(parsed.bytes).toEqual(pngBytes);

    expect(() =>
      parseMediaDataUrl('data:image/svg+xml;base64,PHN2Zz4=', 'image')
    ).toThrow('UNSUPPORTED_MEDIA_TYPE');
    expect(() => parseMediaDataUrl('data:image/png;base64,%%%%', 'image')).toThrow(
      'INVALID_MEDIA_DATA_URL'
    );
    expect(() =>
      parseMediaDataUrl(
        `data:image/png;base64,${Buffer.from('not-a-png').toString('base64')}`,
        'image'
      )
    ).toThrow('MEDIA_SIGNATURE_MISMATCH');
  });

  it('round-trips opaque private storage references and rejects traversal', () => {
    const reference = buildStorageReference(
      'pilot-media',
      'attempts/a/responses/r/file.png'
    );
    expect(parseStorageReference(reference)).toEqual({
      bucket: 'pilot-media',
      objectPath: 'attempts/a/responses/r/file.png',
    });
    expect(() => parseStorageReference('supabase://pilot-media/a/%2E%2E/secret')).toThrow(
      'INVALID_STORAGE_REFERENCE'
    );
  });

  it('requires the configured storage bucket to exist and remain private', () => {
    expect(() => validatePrivateMediaBucket('pilot-media', null)).toThrow(
      'MEDIA_BUCKET_NOT_FOUND'
    );
    expect(() => validatePrivateMediaBucket('pilot-media', {
      id: 'pilot-media',
      public: true,
    })).toThrow('MEDIA_BUCKET_MUST_BE_PRIVATE');
    expect(() => validatePrivateMediaBucket('pilot-media', {
      id: 'pilot-media',
      public: false,
    })).not.toThrow();
  });

  it('accepts the current Supabase server secret and the legacy service-role fallback', () => {
    const previous = {
      url: process.env.SUPABASE_URL,
      secret: process.env.SUPABASE_SECRET_KEY,
      legacy: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    try {
      process.env.SUPABASE_URL = 'https://project.supabase.co';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      process.env.SUPABASE_SECRET_KEY = `sb_secret_${'a'.repeat(40)}`;
      expect(hasMediaStorageConfig()).toBe(true);

      delete process.env.SUPABASE_SECRET_KEY;
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'b'.repeat(64);
      expect(hasMediaStorageConfig()).toBe(true);

      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(hasMediaStorageConfig()).toBe(false);
    } finally {
      if (previous.url === undefined) delete process.env.SUPABASE_URL;
      else process.env.SUPABASE_URL = previous.url;
      if (previous.secret === undefined) delete process.env.SUPABASE_SECRET_KEY;
      else process.env.SUPABASE_SECRET_KEY = previous.secret;
      if (previous.legacy === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.legacy;
    }
  });

  it('uses constant-shape worker authorization and bounded retry backoff', () => {
    const secret = 'a'.repeat(32);
    expect(isProcessingWorkerAuthorized(`Bearer ${secret}`, secret)).toBe(true);
    expect(isProcessingWorkerAuthorized('Bearer wrong', secret)).toBe(false);
    expect(isProcessingWorkerAuthorized(null, secret)).toBe(false);
    expect(computeRetryDelayMs(1)).toBe(30_000);
    expect(computeRetryDelayMs(2)).toBe(60_000);
    expect(computeRetryDelayMs(99)).toBe(15 * 60_000);
  });

  it('prefers Opus WebM and falls back to a browser-supported recording type', () => {
    expect(selectAudioRecordingMimeType(() => true)).toBe('audio/webm;codecs=opus');
    expect(selectAudioRecordingMimeType((type) => type === 'audio/mp4')).toBe('audio/mp4');
    expect(selectAudioRecordingMimeType(() => false)).toBe('');
  });
});
