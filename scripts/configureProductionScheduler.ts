import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JOB_NAME = 'dusunce-izi-processing-drain';
const BASE_URL_SECRET_NAME = 'dusunce_izi_processing_base_url';
const WORKER_SECRET_NAME = 'dusunce_izi_processing_worker_secret';
const SCHEDULE = '* * * * *';

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function productionBaseUrl(): string {
  const parsed = new URL(requiredEnvironment('PRODUCTION_BASE_URL'));
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error('PRODUCTION_BASE_URL must be a credential-free HTTPS URL');
  }
  return parsed.origin;
}

async function upsertVaultSecret(name: string, value: string, description: string) {
  const existing = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id::text
    FROM vault.secrets
    WHERE name = ${name}
    ORDER BY created_at DESC
    LIMIT 1
  `);

  if (existing[0]) {
    await prisma.$executeRaw(Prisma.sql`
      SELECT vault.update_secret(
        ${existing[0].id}::uuid,
        ${value},
        ${name},
        ${description},
        NULL
      )
    `);
    return;
  }

  await prisma.$executeRaw(Prisma.sql`
    SELECT vault.create_secret(${value}, ${name}, ${description}, NULL)
  `);
}

async function main() {
  const baseUrl = productionBaseUrl();
  const workerSecret = requiredEnvironment('PROCESSING_WORKER_SECRET');
  if (workerSecret.length < 32) {
    throw new Error('PROCESSING_WORKER_SECRET must be at least 32 characters');
  }

  await upsertVaultSecret(
    BASE_URL_SECRET_NAME,
    baseUrl,
    'Düşünce İzi production base URL for the processing scheduler'
  );
  await upsertVaultSecret(
    WORKER_SECRET_NAME,
    workerSecret,
    'Düşünce İzi bearer secret for the processing scheduler'
  );

  await prisma.$executeRaw(Prisma.sql`
    SELECT cron.unschedule(${JOB_NAME})
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = ${JOB_NAME})
  `);

  const command = `
    SELECT net.http_get(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = '${BASE_URL_SECRET_NAME}'
        ORDER BY created_at DESC
        LIMIT 1
      ) || '/api/internal/processing/drain?limit=10',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = '${WORKER_SECRET_NAME}'
          ORDER BY created_at DESC
          LIMIT 1
        )
      ),
      timeout_milliseconds := 300000
    )
  `;

  const [scheduled] = await prisma.$queryRaw<Array<{ jobId: bigint }>>(Prisma.sql`
    SELECT cron.schedule(${JOB_NAME}, ${SCHEDULE}, ${command}) AS "jobId"
  `);

  console.info(
    JSON.stringify({
      jobId: scheduled?.jobId?.toString(),
      jobName: JOB_NAME,
      schedule: SCHEDULE,
      target: `${baseUrl}/api/internal/processing/drain?limit=10`,
    })
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
