export type SignedMediaUploadTarget = {
  signedUrl: string;
  storageReference: string;
  mimeType: string;
  fileSize: number;
};

export async function uploadBlobToSignedUrl(input: {
  target: SignedMediaUploadTarget;
  blob: Blob;
  fileName: string;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  if (input.blob.size !== input.target.fileSize) throw new Error('MEDIA_SIZE_CHANGED');

  const body = new FormData();
  body.append('cacheControl', '0');
  body.append('', input.blob, input.fileName);

  const response = await (input.fetchImpl || fetch)(input.target.signedUrl, {
    method: 'PUT',
    headers: { 'x-upsert': 'false' },
    body,
  });
  if (!response.ok) {
    throw new Error(`MEDIA_DIRECT_UPLOAD_FAILED: ${response.status}`);
  }
}

export function mediaUploadErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('MEDIA_TOO_LARGE')) {
    return 'Dosya izin verilen boyut sınırını aşıyor.';
  }
  if (message.includes('UNSUPPORTED_MEDIA_TYPE')) {
    return 'Bu dosya biçimi desteklenmiyor.';
  }
  if (message.includes('MEDIA_DIRECT_UPLOAD_FAILED')) {
    return 'Dosya güvenli depolama alanına yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyiniz.';
  }
  return 'Medya yüklenemedi. Lütfen tekrar deneyiniz.';
}
