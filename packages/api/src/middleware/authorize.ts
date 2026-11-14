import { FastifyRequest, FastifyReply } from 'fastify';
import { MemberRole } from '@postlane/db';
import { ForbiddenError } from '../utils/errors.js';

/**
 * authorize(roles) — preHandler factory.
 * Must be used AFTER authenticateWithWorkspace, which populates request.workspaceMember.
 *
 * @param roles Array of allowed MemberRole values
 */
export function authorize(roles: MemberRole[]) {
  return async function authorizeHandler(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    const member = request.workspaceMember;

    if (!member) {
      throw new ForbiddenError('Workspace membership required');
    }

    if (!roles.includes(member.role as MemberRole)) {
      throw new ForbiddenError(
        `Required role: ${roles.join(' or ')}. Your role: ${member.role}`
      );
    }
  };
}
