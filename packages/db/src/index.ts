// ============================================================
// @postlane/db — Public API
// ============================================================
// Re-export everything consumers need so they never import
// directly from @prisma/client or internal paths.
// ============================================================

// Prisma client singleton
export { prisma, default as db } from "./client";

// All generated Prisma types (models, enums, input types, etc.)
export type {
  User,
  RefreshToken,
  PasswordReset,
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  ConnectedAccount,
  ContentItem,
  ContentMedia,
  PlatformPost,
  PublishJob,
  MediaAsset,
  PostAnalytics,
  AccountAnalytics,
  Subscription,
  Notification,
  AuditLog,
  ContentComment,
  ApiUsageLog,
  // Prisma utility types
  Prisma,
} from "@prisma/client";

// All enums (re-exported as values, not just types)
export {
  WorkspacePlan,
  MemberRole,
  Platform,
  AccountStatus,
  ContentStatus,
  ContentType,
  PostStatus,
  MediaType,
  MediaStatus,
  SubscriptionStatus,
  NotificationType,
} from "@prisma/client";
