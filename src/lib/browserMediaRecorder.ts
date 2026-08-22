export const AUDIO_RECORDING_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
] as const;

export function selectAudioRecordingMimeType(
  isTypeSupported: (mimeType: string) => boolean
): string {
  return AUDIO_RECORDING_MIME_TYPES.find((mimeType) => isTypeSupported(mimeType)) || '';
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('AUDIO_READ_FAILED'));
    reader.onerror = () => reject(reader.error || new Error('AUDIO_READ_FAILED'));
    reader.readAsDataURL(blob);
  });
}
