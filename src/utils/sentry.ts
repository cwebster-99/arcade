import * as Sentry from "@sentry/react";
import pkg from "../../package.json";

export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION || pkg.version;
export const RELEASE = `${pkg.name}@${APP_VERSION}`;

let sentryEnabled = false;

export function initSentry(): boolean {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || sentryEnabled) return sentryEnabled;

  Sentry.init({
    dsn,
    release: RELEASE,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
  });
  Sentry.setTag("app_version", APP_VERSION);
  sentryEnabled = true;
  return true;
}

export function isSentryEnabled(): boolean {
  return sentryEnabled;
}
