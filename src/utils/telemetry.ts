import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/react";
import { APP_VERSION, isSentryEnabled } from "./sentry";

export type Platform = "mobile" | "desktop";

export interface TtffEvent {
  metric: "ttff_ms";
  game: string;
  value: number;
  app_version: string;
  platform: Platform;
  ts: string;
}

export interface TelemetryConfig {
  endpoint?: string;
  sentryEnabled: () => boolean;
  appVersion: string;
}

const defaultConfig = (): TelemetryConfig => ({
  endpoint: import.meta.env.VITE_TELEMETRY_URL || undefined,
  sentryEnabled: isSentryEnabled,
  appVersion: APP_VERSION,
});

let config: TelemetryConfig = defaultConfig();

export function configureTelemetry(overrides: Partial<TelemetryConfig>): void {
  config = { ...config, ...overrides };
}

export function resetTelemetryConfig(): void {
  config = defaultConfig();
}

export function detectPlatform(userAgent?: string): Platform {
  const ua =
    userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ? "mobile" : "desktop";
}

export function buildTtffEvent(
  game: string,
  durationMs: number,
  platform: Platform = detectPlatform(),
  now: Date = new Date(),
): TtffEvent {
  return {
    metric: "ttff_ms",
    game,
    value: Math.max(0, Math.round(durationMs)),
    app_version: config.appVersion,
    platform,
    ts: now.toISOString(),
  };
}

function epochSeconds(perfMs: number): number {
  return (performance.timeOrigin + perfMs) / 1000;
}

export function recordTtff(
  game: string,
  startMs: number,
  endMs: number,
): TtffEvent | null {
  const endpoint = config.endpoint;
  const sentryOn = config.sentryEnabled();
  if (!endpoint && !sentryOn) return null;

  const event = buildTtffEvent(game, endMs - startMs);

  if (sentryOn) {
    const span = Sentry.startInactiveSpan({
      name: `ttff ${game}`,
      op: "ui.render.first_frame",
      startTime: epochSeconds(startMs),
      attributes: { game, platform: event.platform },
    });
    span.setAttribute("ttff_ms", event.value);
    span.end(epochSeconds(endMs));
    Sentry.setMeasurement("ttff_ms", event.value, "millisecond");
  }

  if (endpoint) {
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => {
      // Telemetry is best-effort
    });
  }

  return event;
}

const nextFrame = (cb: () => void): (() => void) => {
  if (typeof requestAnimationFrame === "function") {
    const id = requestAnimationFrame(() => cb());
    return () => cancelAnimationFrame(id);
  }
  const id = setTimeout(cb, 0);
  return () => clearTimeout(id);
};

/** Records time from component mount (first render) to the first painted frame. */
export function useTimeToFirstFrame(game: string): void {
  const mountedAt = useRef<number>(performance.now());

  useEffect(() => {
    const start = mountedAt.current;
    return nextFrame(() => {
      recordTtff(game, start, performance.now());
    });
  }, [game]);
}
