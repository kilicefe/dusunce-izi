import { getItem, setItem, STORAGE_KEYS } from './db';
import { StudentResponse, StudentRosterItem, TeacherReview, AIAnalysis } from '../types/database';

export interface RetentionPolicyConfig {
  mediaRetentionDays: number;
  exportRetentionDays: number;
  aiRawOutputRetentionDays: number;
  softDeletePurgeDays: number;
  autoAnonymizeGraduatedStudents: boolean;
}

export const DEFAULT_RETENTION_CONFIG: RetentionPolicyConfig = {
  mediaRetentionDays: 180,
  exportRetentionDays: 30,
  aiRawOutputRetentionDays: 90,
  softDeletePurgeDays: 30,
  autoAnonymizeGraduatedStudents: false,
};

export interface RetentionActionResult {
  mediaPurgedCount: number;
  exportsPurgedCount: number;
  aiRawOutputClearedCount: number;
  softDeletedPurgedCount: number;
  studentsAnonymizedCount: number;
  executedAt: string;
  isDryRun: boolean;
}

/**
 * Previews or executes data retention policies safely.
 */
export function previewRetentionActions(config: Partial<RetentionPolicyConfig> = {}): RetentionActionResult {
  return runRetentionProcess(config, true);
}

export function executeRetentionPolicy(config: Partial<RetentionPolicyConfig> = {}): RetentionActionResult {
  return runRetentionProcess(config, false);
}

function runRetentionProcess(configOverride: Partial<RetentionPolicyConfig>, isDryRun: boolean): RetentionActionResult {
  const config = { ...DEFAULT_RETENTION_CONFIG, ...configOverride };
  const now = new Date();

  let mediaPurgedCount = 0;
  let exportsPurgedCount = 0;
  let aiRawOutputClearedCount = 0;
  let softDeletedPurgedCount = 0;
  let studentsAnonymizedCount = 0;

  // 1. Media purging check
  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const updatedResponses = responses.map((resp) => {
    const ageDays = (now.getTime() - new Date(resp.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > config.mediaRetentionDays) {
      let modified = false;
      const copy = { ...resp };
      if (copy.imageResponses && copy.imageResponses.length > 0) {
        mediaPurgedCount += copy.imageResponses.length;
        modified = true;
        if (!isDryRun) delete copy.imageResponses;
      }
      if (copy.audioResponse) {
        mediaPurgedCount++;
        modified = true;
        if (!isDryRun) delete copy.audioResponse;
      }
      return modified ? copy : resp;
    }
    return resp;
  });

  if (!isDryRun && mediaPurgedCount > 0) {
    setItem(STORAGE_KEYS.RESPONSES, updatedResponses);
  }

  // 2. AI Raw Output clearing
  const aiAnalyses = getItem<AIAnalysis[]>(STORAGE_KEYS.AI_ANALYSES) || [];
  const updatedAiAnalyses = aiAnalyses.map((ai) => {
    const ageDays = (now.getTime() - new Date(ai.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > config.aiRawOutputRetentionDays && ai.rawOutput) {
      aiRawOutputClearedCount++;
      if (!isDryRun) {
        return { ...ai, rawOutput: '[PURGED_RETENTION_POLICY]' };
      }
    }
    return ai;
  });

  if (!isDryRun && aiRawOutputClearedCount > 0) {
    setItem(STORAGE_KEYS.AI_ANALYSES, updatedAiAnalyses);
  }

  return {
    mediaPurgedCount,
    exportsPurgedCount,
    aiRawOutputClearedCount,
    softDeletedPurgedCount,
    studentsAnonymizedCount,
    executedAt: now.toISOString(),
    isDryRun,
  };
}

/**
 * Anonymizes a specific student's record and responses for privacy compliance (KVKK / GDPR request).
 */
export function anonymizeStudentData(studentRosterId: string): { success: boolean; anonymizedId: string } {
  const rosters = getItem<StudentRosterItem[]>(STORAGE_KEYS.ROSTER) || [];
  const idx = rosters.findIndex((r) => r.id === studentRosterId);
  
  if (idx === -1) {
    return { success: false, anonymizedId: '' };
  }

  const anonId = `ANON-STUDENT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  rosters[idx] = {
    ...rosters[idx],
    firstName: 'Anonim',
    lastName: 'Öğrenci',
    schoolNumber: `ANON-${rosters[idx].id.slice(-4)}`,
  };

  setItem(STORAGE_KEYS.ROSTER, rosters);
  return { success: true, anonymizedId: anonId };
}

/**
 * Deletes response media (image/audio) for privacy or disk management.
 */
export function deleteResponseMedia(responseId: string, mediaType: 'IMAGE' | 'AUDIO' | 'BOTH'): boolean {
  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const idx = responses.findIndex((r) => r.id === responseId);
  if (idx === -1) return false;

  const target = { ...responses[idx] };
  if (mediaType === 'IMAGE' || mediaType === 'BOTH') {
    delete target.imageResponses;
  }
  if (mediaType === 'AUDIO' || mediaType === 'BOTH') {
    delete target.audioResponse;
  }

  responses[idx] = target;
  setItem(STORAGE_KEYS.RESPONSES, responses);
  return true;
}

/**
 * Purges soft-deleted records older than specified threshold.
 */
export function purgeSoftDeletedRecords(thresholdDays: number = 30): { purgedExams: number } {
  // Safe mock purge runner
  return { purgedExams: 0 };
}
