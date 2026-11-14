import { PrismaClient } from '@postlane/db';

export interface AuditLogInput {
  userId?: string | null;
  workspaceId?: string | null;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  constructor(private readonly prisma: PrismaClient) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: input.userId ?? undefined,
          workspaceId: input.workspaceId ?? undefined,
          action: input.action,
          resource: input.resource ?? undefined,
          resourceId: input.resourceId ?? undefined,
          metadata: input.metadata ? (input.metadata as any) : undefined,
          ipAddress: input.ipAddress ?? undefined,
          userAgent: input.userAgent ?? undefined,
        },
      });
    } catch (error) {
      // Don't let audit logging fail the primary user request
      console.error('Failed to create audit log entry:', error);
    }
  }
}
