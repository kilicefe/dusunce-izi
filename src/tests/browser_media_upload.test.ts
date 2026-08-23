import { describe, expect, it, vi } from 'vitest';
import { uploadBlobToSignedUrl } from '../lib/browserMediaUpload';

describe('browser signed media upload', () => {
  it('sends media larger than the Server Action limit directly to signed storage', async () => {
    const blob = new Blob([new Uint8Array(1_200_000)], { type: 'image/png' });
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.method).toBe('PUT');
      expect(new Headers(init?.headers).get('x-upsert')).toBe('false');
      expect(init?.body).toBeInstanceOf(FormData);
      const uploaded = (init?.body as FormData).get('');
      expect(uploaded).toBeInstanceOf(Blob);
      expect((uploaded as Blob).size).toBe(blob.size);
      return new Response(null, { status: 200 });
    });

    await expect(
      uploadBlobToSignedUrl({
        target: {
          signedUrl: 'https://project.supabase.co/storage/v1/object/upload/sign/pilot-media/file.png?token=test',
          storageReference: 'supabase://pilot-media/file.png',
          mimeType: 'image/png',
          fileSize: blob.size,
        },
        blob,
        fileName: 'cevap.png',
        fetchImpl: fetchImpl as typeof fetch,
      })
    ).resolves.toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('fails closed when the selected blob changes size or storage rejects it', async () => {
    const blob = new Blob(['test'], { type: 'audio/webm' });
    const target = {
      signedUrl: 'https://project.supabase.co/signed',
      storageReference: 'supabase://pilot-media/file.webm',
      mimeType: 'audio/webm',
      fileSize: blob.size,
    };

    await expect(
      uploadBlobToSignedUrl({ ...{ target: { ...target, fileSize: blob.size + 1 }, blob }, fileName: 'ses.webm' })
    ).rejects.toThrow('MEDIA_SIZE_CHANGED');
    await expect(
      uploadBlobToSignedUrl({
        target,
        blob,
        fileName: 'ses.webm',
        fetchImpl: (async () => new Response(null, { status: 403 })) as typeof fetch,
      })
    ).rejects.toThrow('MEDIA_DIRECT_UPLOAD_FAILED: 403');
  });
});
