import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthError } from '../utils/errors.js';

/**
 * authenticate preHandler
 * Validates the Bearer JWT, attaches user to request.
 * Uses the fastify.authenticate decorator registered in auth.plugin.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Delegate to the decorated instance method
  await (request.server as any).authenticate(request, reply);
}

/**
 * authenticateWithWorkspace preHandler
 * Validates JWT AND attaches the workspace member record for the workspace
 * identified by :workspaceId route param. Use on workspace-scoped routes.
 */
export async function authenticateWithWorkspace(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await (request.server as any).authenticate(request, reply);

  const params = request.params as Record<string, string>;
  const workspaceId = params?.workspaceId;

  if (!workspaceId) {
    throw new AuthError('Workspace context required');
  }

  const member = await request.server.prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: request.user.id,
        workspaceId,
      },
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!member || (member.workspace as any).deletedAt) {
    throw new AuthError('You do not have access to this workspace');
  }

  request.workspaceMember = member as any;
}
