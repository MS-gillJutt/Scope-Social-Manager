import { create } from "zustand";
import {
  CURRENT_USER,
  CURRENT_WORKSPACE,
  WORKSPACES_LIST,
  CONNECTED_ACCOUNTS,
  MOCK_POSTS,
  MOCK_NOTIFICATIONS,
  MockUser,
  MockWorkspace,
  MockAccount,
  MockPost,
} from "./mock-data";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "success" | "warning" | "error" | "info";
}

interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type?: "success" | "error" | "info" | "warning";
}

interface AppState {
  user: MockUser;
  workspaces: MockWorkspace[];
  activeWorkspace: MockWorkspace;
  accounts: MockAccount[];
  posts: MockPost[];
  notifications: NotificationItem[];
  toasts: ToastItem[];
  isMobileSidebarOpen: boolean;

  // Actions
  setActiveWorkspace: (workspaceId: string) => void;
  setUser: (user: Partial<MockUser>) => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;

  // Post Actions
  addPost: (post: Omit<MockPost, "id" | "author">) => void;
  updatePostStatus: (id: string, status: MockPost["status"]) => void;
  retryPost: (id: string) => void;
  deletePost: (id: string) => void;

  // Account Actions
  reconnectAccount: (accountId: string) => void;
  disconnectAccount: (accountId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: CURRENT_USER,
  workspaces: WORKSPACES_LIST,
  activeWorkspace: CURRENT_WORKSPACE,
  accounts: CONNECTED_ACCOUNTS,
  posts: MOCK_POSTS,
  notifications: MOCK_NOTIFICATIONS,
  toasts: [],
  isMobileSidebarOpen: false,

  setActiveWorkspace: (workspaceId) => {
    const ws = get().workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      set({ activeWorkspace: ws });
      get().addToast({
        title: "Workspace Switched",
        message: `Active workspace is now ${ws.name}`,
        type: "info",
      });
    }
  },

  setUser: (updated) => {
    set((state) => ({ user: { ...state.user, ...updated } }));
  },

  toggleMobileSidebar: () => {
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen }));
  },

  closeMobileSidebar: () => {
    set({ isMobileSidebarOpen: false });
  },

  markNotificationAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllNotificationsAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  addToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    setTimeout(() => {
      get().removeToast(id);
    }, 4500);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  addPost: (postData) => {
    const id = `post_${Date.now()}`;
    const newPost: MockPost = {
      ...postData,
      id,
      author: {
        name: get().user.name,
        avatar: get().user.avatar,
      },
    };
    set((state) => ({
      posts: [newPost, ...state.posts],
      activeWorkspace: {
        ...state.activeWorkspace,
        scheduledPostsCount: state.activeWorkspace.scheduledPostsCount + 1,
      },
    }));
    get().addToast({
      title: "Post Scheduled Successfully!",
      message: `Your post is set for ${new Date(newPost.scheduledFor).toLocaleString()}`,
      type: "success",
    });
  },

  updatePostStatus: (id, status) => {
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, status } : p)),
    }));
  },

  retryPost: (id) => {
    set((state) => ({
      posts: state.posts.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            status: "scheduled",
            errorMessage: undefined,
            platformStatuses: Object.keys(p.platformStatuses).reduce(
              (acc, plat) => ({ ...acc, [plat]: "pending" }),
              {}
            ),
          };
        }
        return p;
      }),
    }));
    get().addToast({
      title: "Retrying Post Publishing",
      message: "Queued for immediate retry.",
      type: "info",
    });
  },

  deletePost: (id) => {
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
    }));
    get().addToast({
      title: "Post Deleted",
      type: "info",
    });
  },

  reconnectAccount: (accountId) => {
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === accountId
          ? {
              ...a,
              status: "active",
              tokenExpiresInDays: undefined,
              lastSyncedAt: "Just now",
            }
          : a
      ),
    }));
    get().addToast({
      title: "Account Reconnected",
      message: "OAuth token refreshed successfully.",
      type: "success",
    });
  },

  disconnectAccount: (accountId) => {
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === accountId ? { ...a, status: "disconnected" } : a
      ),
    }));
    get().addToast({
      title: "Account Disconnected",
      type: "warning",
    });
  },
}));
