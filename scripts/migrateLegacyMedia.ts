import { PrismaClient } from '@prisma/client';
import { deleteStoredMedia, uploadStudentMedia } from '../src/lib/mediaStorage';

const prisma = new PrismaClient();
const BATCH_SIZE = 50;

async function migrateImages(): Promise<number> {
  let migrated = 0;
  while (true) {
    const images = await prisma.imageResponse.findMany({
      where: { storageUrl: { startsWith: 'data:' } },
      include: { studentResponse: { select: { attemptId: true } } },
      take: BATCH_SIZE,
      orderBy: { id: 'asc' },
    });
    if (!images.length) return migrated;

    for (const image of images) {
      const uploaded = await uploadStudentMedia({
        attemptId: image.studentResponse.attemptId,
        studentResponseId: image.studentResponseId,
        kind: 'image',
        dataUrl: image.storageUrl,
      });
      const updated = await prisma.imageResponse.updateMany({
        where: { id: image.id, storageUrl: image.storageUrl },
        data: {
          storageUrl: uploaded.storageReference,
          mimeType: uploaded.mimeType,
          fileSize: uploaded.fileSize,
        },
      });
      if (updated.count !== 1) {
        await deleteStoredMedia(uploaded.storageReference);
        continue;
      }
      migrated += 1;
    }
  }
}

async function migrateAudio(): Promise<number> {
  let migrated = 0;
  while (true) {
    const recordings = await prisma.audioResponse.findMany({
      where: { storageUrl: { startsWith: 'data:' } },
      include: { studentResponse: { select: { attemptId: true } } },
      take: BATCH_SIZE,
      orderBy: { id: 'asc' },
    });
    if (!recordings.length) return migrated;

    for (const recording of recordings) {
      const uploaded = await uploadStudentMedia({
        attemptId: recording.studentResponse.attemptId,
        studentResponseId: recording.studentResponseId,
        kind: 'audio',
        dataUrl: recording.storageUrl,
      });
      const updated = await prisma.audioResponse.updateMany({
        where: { id: recording.id, storageUrl: recording.storageUrl },
        data: {
          storageUrl: uploaded.storageReference,
          mimeType: uploaded.mimeType,
          fileSize: uploaded.fileSize,
        },
      });
      if (updated.count !== 1) {
        await deleteStoredMedia(uploaded.storageReference);
        continue;
      }
      migrated += 1;
    }
  }
}

async function main() {
  const [images, audio] = await Promise.all([migrateImages(), migrateAudio()]);
  const [remainingImages, remainingAudio, unsupportedImages, unsupportedAudio] =
    await Promise.all([
      prisma.imageResponse.count({ where: { storageUrl: { startsWith: 'data:' } } }),
      prisma.audioResponse.count({ where: { storageUrl: { startsWith: 'data:' } } }),
      prisma.imageResponse.count({
        where: {
          NOT: [
            { storageUrl: { startsWith: 'supabase://' } },
            { storageUrl: { startsWith: 'data:' } },
          ],
        },
      }),
      prisma.audioResponse.count({
        where: {
          NOT: [
            { storageUrl: { startsWith: 'supabase://' } },
            { storageUrl: { startsWith: 'data:' } },
          ],
        },
      }),
    ]);

  console.log(JSON.stringify({ migratedImages: images, migratedAudio: audio }));
  if (remainingImages || remainingAudio || unsupportedImages || unsupportedAudio) {
    throw new Error(
      `MEDIA_BACKFILL_INCOMPLETE: remainingDataUrls=${remainingImages + remainingAudio}, unsupportedReferences=${unsupportedImages + unsupportedAudio}`
    );
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
