export const APP_CONFIG = {
  storage: {
    sidebarWidthKey: 'fk-planner-sidebar-width',
    profileNameKey: 'fk-planner-profile-name',
    profileAvatarId: 'profile-avatar',
  },
  sidebar: {
    defaultWidth: 242,
    minWidth: 205,
    maxWidth: 380,
    resizeStep: 16,
    visibleSeasons: 7,
  },
  persistence: {
    autosaveDelayMs: 450,
    toastDurationMs: 2500,
  },
  profile: {
    avatarMaxSizeBytes: 10 * 1024 * 1024,
    allowedAvatarTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'],
    minimumPasswordLength: 8,
  },
  planning: {
    softDeadlineBufferDays: 2,
    ganttStartPaddingDays: 3,
    ganttMinimumDaysAhead: 38,
    ganttMinimumVisibleDays: 42,
    ganttDayWidthPx: 28,
  },
} as const
