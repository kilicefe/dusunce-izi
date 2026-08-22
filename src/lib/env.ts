import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for production database connectivity'),
  DIRECT_URL: z.string().optional(),
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 characters'),
  AUTH_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SECRET_KEY: z.string().min(32).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(32).optional(),
  SUPABASE_MEDIA_BUCKET: z.string().min(1).optional(),
  PROCESSING_WORKER_SECRET: z.string().min(32).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Environment configuration validation failed. Check server logs.');
  }
  return result.data;
}

export const env = {
  get DATABASE_URL() { return process.env.DATABASE_URL || ''; },
  get AUTH_SECRET() { return process.env.AUTH_SECRET || ''; },
  get NODE_ENV() { return process.env.NODE_ENV || 'development'; },
};
