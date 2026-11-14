import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { MemberRole } from '@postlane/db';
import { WorkspaceService } from '../../services/workspace.service.js';
import {
  authenticate,
  authenticateWithWorkspace,
} from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import {
  successResponse,
  messageResponse,
  errorResponse,
} from '../../utils/response.js';

const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(50),
  timezone: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  logoUrl: z.string().url().nullable().optional(),
  timezone: z.string().optional(),
  website: z.string().url().nullable().optional(),
});

const deleteWorkspaceSchema = z.object({
  confirmName: z.string().min(1, 'Workspace confirmation name is required'),
});

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(MemberRole),
});

const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(MemberRole),
});

export const workspaceRoutes: FastifyPluginAsync = async (fastify) => {
  const workspaceService = new WorkspaceService(fastify.prisma);

  // Authenticate base hook
  fastify.addHook('preHandler', authenticate);

  /**
   * POST /workspaces
   * Create workspace (auto-assign OWNER role, create free subscription)
   */
  fastify.post('/', async (request, reply) => {
    const parsed = createWorkspaceSchema.safeParse(request.body);
    if (!parsed.success) {
      return errorResponse(
        reply,
        422,
        'VALIDATION_ERROR',
        'Invalid workspace data',
        parsed.error.flatten().fieldErrors
      );
    }

    const workspace = await workspaceService.createWorkspace(
      request.user.id,
      parsed.data
    );

    return successResponse(reply, workspace, 201, 'Workspace created successfully');
  });

  /**
   * GET /workspaces
   * List current user's workspaces
   */
  fastify.get('/', async (request, reply) => {
    const workspaces = await workspaceService.listUserWorkspaces(request.user.id);
    return successResponse(reply, workspaces);
  });

  /**
   * POST /workspaces/invitations/:token/accept
   * Accept an invitation to join a workspace
   */
  fastify.post('/invitations/:token/accept', async (request, reply) => {
    const { token } = request.params as { token: string };

    const result = await workspaceService.acceptInvitation(
      token,
      request.user.id
    );

    return successResponse(
      reply,
      result,
      200,
      'Invitation accepted! You are now a member of this workspace.'
    );
  });

  /**
   * GET /workspaces/:workspaceId
   * Get workspace details
   */
  fastify.get(
    '/:workspaceId',
    { preHandler: [authenticateWithWorkspace] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const workspace = await workspaceService.getWorkspace(
        workspaceId,
        request.user.id
      );
      return successResponse(reply, workspace);
    }
  );

  /**
   * PATCH /workspaces/:workspaceId
   * Update workspace (name, logo, timezone)
   */
  fastify.patch(
    '/:workspaceId',
    {
      preHandler: [
        authenticateWithWorkspace,
        authorize([MemberRole.OWNER, MemberRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const parsed = updateWorkspaceSchema.safeParse(request.body);

      if (!parsed.success) {
        return errorResponse(
          reply,
          422,
          'VALIDATION_ERROR',
          'Invalid workspace data',
          parsed.error.flatten().fieldErrors
        );
      }

      const updated = await workspaceService.updateWorkspace(
        workspaceId,
        request.user.id,
        parsed.data
      );

      return successResponse(reply, updated, 200, 'Workspace updated successfully');
    }
  );

  /**
   * DELETE /workspaces/:workspaceId
   * Delete workspace (OWNER only, requires confirmation)
   */
  fastify.delete(
    '/:workspaceId',
    {
      preHandler: [
        authenticateWithWorkspace,
        authorize([MemberRole.OWNER]),
      ],
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const parsed = deleteWorkspaceSchema.safeParse(request.body);

      if (!parsed.success) {
        return errorResponse(
          reply,
          422,
          'VALIDATION_ERROR',
          'Confirmation name is required'
        );
      }

      await workspaceService.deleteWorkspace(
        workspaceId,
        request.user.id,
        parsed.data.confirmName
      );

      return messageResponse(reply, 'Workspace deleted successfully');
    }
  );

  /**
   * GET /workspaces/:workspaceId/members
   * List members of workspace
   */
  fastify.get(
    '/:workspaceId/members',
    { preHandler: [authenticateWithWorkspace] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const members = await workspaceService.listMembers(workspaceId);
      return successResponse(reply, members);
    }
  );

  /**
   * POST /workspaces/:workspaceId/members/invite
   * Invite member by email
   */
  fastify.post(
    '/:workspaceId/members/invite',
    {
      preHandler: [
        authenticateWithWorkspace,
        authorize([MemberRole.OWNER, MemberRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const parsed = inviteMemberSchema.safeParse(request.body);

      if (!parsed.success) {
        return errorResponse(
          reply,
          422,
          'VALIDATION_ERROR',
          'Invalid invitation data',
          parsed.error.flatten().fieldErrors
        );
      }

      const result = await workspaceService.inviteMember(
        workspaceId,
        request.user.id,
        parsed.data
      );

      return successResponse(reply, result, 201, result.message);
    }
  );

  /**
   * PATCH /workspaces/:workspaceId/members/:memberId
   * Change member role (OWNER/ADMIN only)
   */
  fastify.patch(
    '/:workspaceId/members/:memberId',
    {
      preHandler: [
        authenticateWithWorkspace,
        authorize([MemberRole.OWNER, MemberRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const { workspaceId, memberId } = request.params as {
        workspaceId: string;
        memberId: string;
      };

      const parsed = updateMemberRoleSchema.safeParse(request.body);
      if (!parsed.success) {
        return errorResponse(
          reply,
          422,
          'VALIDATION_ERROR',
          'Valid role is required'
        );
      }

      const updated = await workspaceService.updateMemberRole(
        workspaceId,
        request.user.id,
        memberId,
        parsed.data.role
      );

      return successResponse(reply, updated, 200, 'Member role updated successfully');
    }
  );

  /**
   * DELETE /workspaces/:workspaceId/members/:memberId
   * Remove member from workspace
   */
  fastify.delete(
    '/:workspaceId/members/:memberId',
    { preHandler: [authenticateWithWorkspace] },
    async (request, reply) => {
      const { workspaceId, memberId } = request.params as {
        workspaceId: string;
        memberId: string;
      };

      await workspaceService.removeMember(
        workspaceId,
        request.user.id,
        memberId
      );

      return messageResponse(reply, 'Member removed from workspace');
    }
  );

  /**
   * GET /workspaces/:workspaceId/usage
   * Return current usage vs plan limits
   */
  fastify.get(
    '/:workspaceId/usage',
    { preHandler: [authenticateWithWorkspace] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const usage = await workspaceService.getWorkspaceUsage(workspaceId);
      return successResponse(reply, usage);
    }
  );
};
