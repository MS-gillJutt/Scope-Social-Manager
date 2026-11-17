import {
  PrismaClient,
  Workspace,
  WorkspaceMember,
  MemberRole,
  WorkspacePlan,
  SubscriptionStatus,
} from '@scope/db';
import crypto from 'crypto';
import { generateUniqueSlug } from '../utils/slug.js';
import { EmailService } from './email.service.js';
import { AuditService } from './audit.service.js';
import {
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  AuthError,
} from '../utils/errors.js';
import { PLAN_LIMITS } from '@scope/config';

// Roles allowed to manage a workspace (owner/admin). Typed as MemberRole[]
// so `.includes(member.role)` accepts the full MemberRole union (which also
// has MANAGER / EDITOR / VIEWER) instead of narrowing to "OWNER" | "ADMIN".
const ADMIN_ROLES: MemberRole[] = [MemberRole.OWNER, MemberRole.ADMIN];

export interface CreateWorkspaceInput {
  name: string;
  timezone?: string;
  logoUrl?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  // null clears the field (the service passes it straight to Prisma);
  // the route's zod schema already allows nullable for both.
  logoUrl?: string | null;
  timezone?: string;
  website?: string | null;
}

export interface InviteMemberInput {
  email: string;
  role: MemberRole;
}

export class WorkspaceService {
  private emailService: EmailService;
  private auditService: AuditService;

  constructor(private readonly prisma: PrismaClient) {
    this.emailService = new EmailService();
    this.auditService = new AuditService(prisma);
  }

  /**
   * Create a new workspace: generates unique slug, creates FREE subscription,
   * and assigns the creator as OWNER.
   */
  async createWorkspace(
    userId: string,
    input: CreateWorkspaceInput
  ): Promise<Workspace> {
    const slug = await generateUniqueSlug(this.prisma, input.name);

    const workspace = await this.prisma.$transaction(async (tx) => {
      // 1. Create workspace
      const ws = await tx.workspace.create({
        data: {
          name: input.name.trim(),
          slug,
          timezone: input.timezone || 'UTC',
          logoUrl: input.logoUrl,
          plan: WorkspacePlan.FREE,
        },
      });

      // 2. Add owner member
      await tx.workspaceMember.create({
        data: {
          workspaceId: ws.id,
          userId,
          role: MemberRole.OWNER,
        },
      });

      // 3. Create initial FREE subscription record
      await tx.subscription.create({
        data: {
          workspaceId: ws.id,
          plan: WorkspacePlan.FREE,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      return ws;
    });

    await this.auditService.log({
      userId,
      workspaceId: workspace.id,
      action: 'workspace.created',
      resource: 'workspace',
      resourceId: workspace.id,
      metadata: { name: workspace.name, slug: workspace.slug },
    });

    return workspace;
  }

  /**
   * List all workspaces where the user is a member
   */
  async listUserWorkspaces(userId: string): Promise<
    (Workspace & {
      role: MemberRole;
      membersCount: number;
    })[]
  > {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId,
        workspace: { deletedAt: null },
      },
      include: {
        workspace: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      membersCount: m.workspace._count.members,
    }));
  }

  /**
   * Get workspace details by ID
   */
  async getWorkspace(
    workspaceId: string,
    userId: string
  ): Promise<Workspace & { role: MemberRole; membersCount: number }> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { userId, workspaceId },
      },
      include: {
        workspace: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
    });

    if (!member || member.workspace.deletedAt) {
      throw new NotFoundError('Workspace');
    }

    return {
      ...member.workspace,
      role: member.role,
      membersCount: member.workspace._count.members,
    };
  }

  /**
   * Update workspace details (OWNER or ADMIN only)
   */
  async updateWorkspace(
    workspaceId: string,
    userId: string,
    input: UpdateWorkspaceInput
  ): Promise<Workspace> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { userId, workspaceId } },
    });

    if (!member || !ADMIN_ROLES.includes(member.role)) {
      throw new ForbiddenError('Only workspace owners or admins can update details');
    }

    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
        ...(input.timezone && { timezone: input.timezone }),
        ...(input.website !== undefined && { website: input.website }),
      },
    });

    await this.auditService.log({
      userId,
      workspaceId,
      action: 'workspace.updated',
      resource: 'workspace',
      resourceId: workspaceId,
      metadata: input as any,
    });

    return updated;
  }

  /**
   * Soft delete workspace (OWNER only)
   */
  async deleteWorkspace(
    workspaceId: string,
    userId: string,
    confirmName: string
  ): Promise<void> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { userId, workspaceId } },
      include: { workspace: true },
    });

    if (!member || member.role !== MemberRole.OWNER) {
      throw new ForbiddenError('Only the workspace owner can delete it');
    }

    if (member.workspace.name !== confirmName.trim()) {
      throw new ValidationError(
        'Workspace name does not match confirmation. Deletion cancelled.'
      );
    }

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      workspaceId,
      action: 'workspace.deleted',
      resource: 'workspace',
      resourceId: workspaceId,
    });
  }

  /**
   * List workspace members
   */
  async listMembers(workspaceId: string): Promise<
    (WorkspaceMember & {
      user: { id: string; name: string; email: string; avatarUrl: string | null };
    })[]
  > {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * Invite member by email
   */
  async inviteMember(
    workspaceId: string,
    inviterId: string,
    input: InviteMemberInput
  ): Promise<{ message: string; invitationId: string }> {
    const inviter = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { userId: inviterId, workspaceId } },
      include: {
        workspace: true,
        user: { select: { name: true } },
      },
    });

    if (!inviter || !ADMIN_ROLES.includes(inviter.role)) {
      throw new ForbiddenError('Only workspace owners or admins can invite members');
    }

    // Role restrictions: ADMIN cannot invite OWNER
    if (input.role === MemberRole.OWNER) {
      throw new ForbiddenError('Cannot invite someone as OWNER');
    }

    const email = input.email.toLowerCase().trim();

    // Check if user is already a member
    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email },
      },
    });

    if (existingMember) {
      throw new ConflictError('User is already a member of this workspace');
    }

    // Check pending invitation
    const existingInvite = await this.prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new ConflictError(
        'An active invitation has already been sent to this email'
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email,
        role: input.role,
        token,
        expiresAt,
        invitedBy: inviterId,
      },
    });

    await this.emailService.sendTeamInviteEmail(
      email,
      inviter.user.name,
      inviter.workspace.name,
      token,
      input.role
    );

    await this.auditService.log({
      userId: inviterId,
      workspaceId,
      action: 'member.invited',
      resource: 'invitation',
      resourceId: invitation.id,
      metadata: { email, role: input.role },
    });

    return {
      message: `Invitation sent to ${email}`,
      invitationId: invitation.id,
    };
  }

  /**
   * Update member role (OWNER/ADMIN only)
   */
  async updateMemberRole(
    workspaceId: string,
    actingUserId: string,
    memberId: string,
    newRole: MemberRole
  ): Promise<WorkspaceMember> {
    const actingMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { userId: actingUserId, workspaceId } },
    });

    if (!actingMember || !ADMIN_ROLES.includes(actingMember.role)) {
      throw new ForbiddenError('Only workspace owners or admins can change member roles');
    }

    const targetMember = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      throw new NotFoundError('Member');
    }

    // Cannot change OWNER role unless acting user is OWNER
    if (targetMember.role === MemberRole.OWNER && actingMember.role !== MemberRole.OWNER) {
      throw new ForbiddenError('Cannot change the role of the workspace owner');
    }

    if (newRole === MemberRole.OWNER) {
      throw new ForbiddenError(
        'Ownership cannot be transferred this way. Contact support or use transfer ownership.'
      );
    }

    const updated = await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: newRole },
    });

    await this.auditService.log({
      userId: actingUserId,
      workspaceId,
      action: 'member.role_updated',
      resource: 'workspaceMember',
      resourceId: memberId,
      metadata: { oldRole: targetMember.role, newRole },
    });

    return updated;
  }

  /**
   * Remove member from workspace
   */
  async removeMember(
    workspaceId: string,
    actingUserId: string,
    memberId: string
  ): Promise<void> {
    const actingMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { userId: actingUserId, workspaceId } },
    });

    const targetMember = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      throw new NotFoundError('Member');
    }

    // A member can remove themselves (leave workspace) unless they are the owner
    const isSelf = targetMember.userId === actingUserId;

    if (!isSelf) {
      if (!actingMember || !ADMIN_ROLES.includes(actingMember.role)) {
        throw new ForbiddenError('Only owners or admins can remove members');
      }
      if (targetMember.role === MemberRole.OWNER) {
        throw new ForbiddenError('Cannot remove workspace owner');
      }
    } else {
      if (targetMember.role === MemberRole.OWNER) {
        throw new ForbiddenError('Owner cannot leave workspace. Transfer ownership or delete it.');
      }
    }

    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    await this.auditService.log({
      userId: actingUserId,
      workspaceId,
      action: isSelf ? 'member.left' : 'member.removed',
      resource: 'workspaceMember',
      resourceId: memberId,
      metadata: { targetUserId: targetMember.userId },
    });
  }

  /**
   * Accept workspace invitation
   */
  async acceptInvitation(
    token: string,
    userId: string
  ): Promise<{ workspaceId: string }> {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      throw new AuthError('Invitation link is invalid or has expired');
    }

    if (invitation.workspace.deletedAt) {
      throw new NotFoundError('Workspace no longer exists');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) throw new NotFoundError('User');

    // Create membership & mark invitation accepted
    await this.prisma.$transaction([
      this.prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
        },
      }),
      this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    await this.auditService.log({
      userId,
      workspaceId: invitation.workspaceId,
      action: 'invitation.accepted',
      resource: 'invitation',
      resourceId: invitation.id,
    });

    return { workspaceId: invitation.workspaceId };
  }

  /**
   * Get workspace usage stats vs plan limits
   */
  async getWorkspaceUsage(workspaceId: string): Promise<Record<string, unknown>> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
      include: {
        subscription: true,
        _count: {
          select: {
            members: true,
            connectedAccounts: true,
          },
        },
      },
    });

    if (!workspace) throw new NotFoundError('Workspace');

    // Plan config key
    const planKey = (workspace.plan.toLowerCase() === 'free'
      ? 'free'
      : workspace.plan.toLowerCase() === 'starter'
      ? 'starter'
      : workspace.plan.toLowerCase() === 'professional'
      ? 'pro'
      : 'agency') as keyof typeof PLAN_LIMITS;

    const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;

    // Count scheduled posts in current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const postsThisMonth = await this.prisma.contentItem.count({
      where: {
        workspaceId,
        createdAt: { gte: startOfMonth },
      },
    });

    // Sum media storage bytes (MediaAsset.size is BigInt bytes)
    const mediaAgg = await this.prisma.mediaAsset.aggregate({
      where: { workspaceId, deletedAt: null },
      _sum: { size: true },
    });

    const usedStorageBytes = Number(mediaAgg._sum?.size ?? 0);
    const limitStorageBytes = limits.mediaStorageGB * 1024 * 1024 * 1024;

    return {
      plan: workspace.plan,
      subscriptionStatus: workspace.subscription?.status ?? 'ACTIVE',
      limits,
      usage: {
        members: {
          used: workspace._count.members,
          limit: limits.teamMembers,
        },
        socialAccounts: {
          used: workspace._count.connectedAccounts,
          limit: limits.socialAccounts,
        },
        postsThisMonth: {
          used: postsThisMonth,
          limit: limits.scheduledPosts,
        },
        storage: {
          usedBytes: usedStorageBytes,
          limitBytes: limitStorageBytes,
          usedGB: Math.round((usedStorageBytes / (1024 * 1024 * 1024)) * 100) / 100,
          limitGB: limits.mediaStorageGB,
        },
      },
    };
  }
}
