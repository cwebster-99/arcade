import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sentryMocks = vi.hoisted(() => {
  const span = { setAttribute: vi.fn(), end: vi.fn() };
  return {
    span,
    startInactiveSpan: vi.fn(() => span),
    setMeasurement: vi.fn(),
  };
});

vi.mock("@sentry/react", () => ({
  startInactiveSpan: sentryMocks.startInactiveSpan,
  setMeasurement: sentryMocks.setMeasurement,
  init: vi.fn(),
  setTag: vi.fn(),
  browserTracingIntegration: vi.fn(),
}));

import {
  buildTtffEvent,
  configureTelemetry,
  detectPlatform,
  recordTtff,
  resetTelemetryConfig,
  useTimeToFirstFrame,
} from "./telemetry";

describe("telemetry", () => {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(null)));

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    configureTelemetry({
      appVersion: "1.4.0",
      endpoint: undefined,
      sentryEnabled: () => false,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    resetTelemetryConfig();
  });

  it("detects mobile and desktop user agents", () => {
    expect(
      detectPlatform(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      ),
    ).toBe("mobile");
    expect(
      detectPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/124.0 Mobile Safari/537.36"),
    ).toBe("mobile");
    expect(
      detectPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0 Safari/537.36"),
    ).toBe("desktop");
  });

  it("builds a ttff event with app_version and rounded value", () => {
    const now = new Date("2026-10-01T12:00:00.000Z");
    expect(buildTtffEvent("snake", 123.6, "desktop", now)).toEqual({
      metric: "ttff_ms",
      game: "snake",
      value: 124,
      app_version: "1.4.0",
      platform: "desktop",
      ts: "2026-10-01T12:00:00.000Z",
    });
  });

  it("clamps negative durations to zero", () => {
    expect(buildTtffEvent("snake", -5, "desktop").value).toBe(0);
  });

  it("is a no-op when neither Sentry nor an endpoint is configured", () => {
    expect(recordTtff("snake", 0, 100)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sentryMocks.startInactiveSpan).not.toHaveBeenCalled();
  });

  it("posts the event to the telemetry endpoint", () => {
    configureTelemetry({ endpoint: "http://localhost:4319/ingest" });
    const event = recordTtff("tetris", 10, 260);

    expect(event?.value).toBe(250);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost:4319/ingest");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({
      metric: "ttff_ms",
      game: "tetris",
      value: 250,
      app_version: "1.4.0",
    });
  });

  it("records a Sentry span and measurement when Sentry is enabled", () => {
    configureTelemetry({ sentryEnabled: () => true });
    recordTtff("snake", 0, 42);

    expect(sentryMocks.startInactiveSpan).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ttff snake", op: "ui.render.first_frame" }),
    );
    expect(sentryMocks.span.setAttribute).toHaveBeenCalledWith("ttff_ms", 42);
    expect(sentryMocks.span.end).toHaveBeenCalled();
    expect(sentryMocks.setMeasurement).toHaveBeenCalledWith("ttff_ms", 42, "millisecond");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("useTimeToFirstFrame records once on the next frame", async () => {
    configureTelemetry({ endpoint: "http://localhost:4319/ingest" });
    let frameCb: FrameRequestCallback | undefined;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frameCb = cb;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    renderHook(() => useTimeToFirstFrame("flappy"));
    expect(fetchMock).not.toHaveBeenCalled();

    frameCb?.(performance.now());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string).game).toBe("flappy");
  });
});
