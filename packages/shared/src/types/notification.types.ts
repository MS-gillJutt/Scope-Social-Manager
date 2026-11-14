// =============================================================================
// Notification Types
// =============================================================================

export type NotificationKind =
  | "post_published"
  | "post_failed"
  | "token_expiring"
  | "token_expired"
  | "member_joined"
  | "member_left"
  | "invitation_accepted"
  | "plan_upgraded"
  | "plan_downgraded"
  | "payment_failed"
  | "payment_succeeded"
  | "usage_limit_warning"
  | "analytics_report_ready";

export interface Notification {
  id: string;
  workspaceId: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Optional link to navigate to on click */
  actionUrl: string | null;
  /** Optional structured payload for in-app rendering */
  metadata: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  kinds: Partial<Record<NotificationKind, { email: boolean; inApp: boolean }>>;
}

export interface MarkNotificationsReadInput {
  ids: string[]; // empty array = mark all as read
}

export interface NotificationFilter {
  unreadOnly?: boolean;
  kinds?: NotificationKind[];
}
