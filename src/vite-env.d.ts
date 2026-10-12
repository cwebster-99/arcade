/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_TELEMETRY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
