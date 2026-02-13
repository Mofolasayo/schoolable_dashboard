import { env } from './env';

/**
 * Application configuration
 * Centralized configuration object for the entire application
 */
const featureFlags = {
  enableDevTools: env.NEXT_PUBLIC_ENABLE_DEV_TOOLS,
} as const;

export const config = {
  app: {
    name: 'WorkSight',
    url: env.NEXT_PUBLIC_APP_URL,
  },
  api: {
    baseUrl: env.NEXT_PUBLIC_API_URL,
  },
  features: featureFlags,
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export { dashboardNavigation, dashboardNavigationSections } from './navigation';
export type { NavigationItem, NavigationSectionKey } from './navigation';
