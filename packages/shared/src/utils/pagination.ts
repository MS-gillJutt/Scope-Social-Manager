import { PAGINATION } from "@scope/config";
import type { PaginatedResult } from "../types/api.types.js";

export interface PaginationParams {
  page?: number | string;
  pageSize?: number | string;
}

export interface NormalizedPagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

/**
 * Normalizes page and pageSize query parameters into safe integers and database offsets (skip/take).
 */
export function normalizePagination(params?: PaginationParams): NormalizedPagination {
  const page = Math.max(1, parseInt(String(params?.page || 1), 10) || 1);
  let pageSize = parseInt(String(params?.pageSize || PAGINATION.DEFAULT_PAGE_SIZE), 10) || PAGINATION.DEFAULT_PAGE_SIZE;

  if (pageSize < 1) pageSize = PAGINATION.DEFAULT_PAGE_SIZE;
  if (pageSize > PAGINATION.MAX_PAGE_SIZE) pageSize = PAGINATION.MAX_PAGE_SIZE;

  const skip = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    skip,
    take: pageSize,
  };
}

/**
 * Constructs a standard PaginatedResult object.
 */
export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / pageSize) || 1;

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
