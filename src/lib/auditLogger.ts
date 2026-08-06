import prisma from '@/lib/prisma';

export interface AuditLogOptions {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function createAuditLog(options: AuditLogOptions) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: options.actorId,
        action: `${options.entityType.toUpperCase()}_${options.action.toUpperCase()}`,
        resource: `${options.entityType}:${options.entityId}`,
        details: options.details || {},
        ipAddress: options.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Audit logging failure shouldn't crash primary user transaction unless strictly required
    return null;
  }
}
