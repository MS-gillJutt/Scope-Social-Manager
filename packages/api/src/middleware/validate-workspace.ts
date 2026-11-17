import { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

/**
 * validateWorkspace preHandler
 * Ensures the :workspaceId param belongs to the authenticated user.
 * Must be used AFTER authenticate middleware.
 *
 * This is a lightweight check used on routes where we don't need the full
 * workspace member record — just ownership verification.
 */
export async function validateWorkspace(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const params = request.params as Record<string, string>;
  const workspaceId = params?.workspaceId;

  if (!workspaceId) return; // route doesn't have workspaceId

  const workspace = await request.server.prisma.workspace.findUnique({
    where: { id: workspaceId, deletedAt: null },
    select: { id: true },
  });

  if (!workspace) {
    throw new NotFoundError('Workspace');
  }

  const member = await request.server.prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        userId: request.user.id,
        workspaceId,
      },
    },
    select: { id: true, role: true },
  });

  if (!member) {
    throw new ForbiddenError('You are not a member of this workspace');
  }
}
