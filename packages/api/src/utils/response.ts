import { FastifyReply } from 'fastify';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function successResponse<T>(
  reply: FastifyReply,
  data: T,
  statusCode = 200,
  message?: string
) {
  return reply.code(statusCode).send({
    success: true,
    ...(message && { message }),
    data,
  });
}

export function paginatedResponse<T>(
  reply: FastifyReply,
  data: T[],
  meta: PaginationMeta,
  statusCode = 200
) {
  return reply.code(statusCode).send({
    success: true,
    data,
    meta,
  });
}

export function errorResponse(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
) {
  return reply.code(statusCode).send({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
}

export function messageResponse(reply: FastifyReply, message: string, statusCode = 200) {
  return reply.code(statusCode).send({
    success: true,
    message,
  });
}

export function parsePagination(query: Record<string, unknown>): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
