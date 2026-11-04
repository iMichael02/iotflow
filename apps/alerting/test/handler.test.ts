import { describe, it, expect, vi } from "vitest";
import { createHandler } from "../src/lib/handler";
import { DEFAULT_RULES } from "../src/lib/rules";
import { WebhookNotifier } from "../src/lib/notifier";

const message = (temperature: number) =>
    JSON.stringify({
        deviceId: "dev-1",
        deviceType: "temperature_humidity",
        recordedAt: "2026-11-04T08:00:00.000Z",
        receivedAt: "2026-11-04T08:00:00.000Z",
        topic: "iotflow/devices/dev-1/telemetry",
        data: { temperature, humidity: 50 },
    });

const build = () => {
    const notify = vi.fn().mockResolvedValue(undefined);
    const handle = createHandler({
        rules: DEFAULT_RULES,
        notifiers: [{ notify }],
        cooldownMs: 60_000,
        latencyBudgetMs: 1000,
        now: () => new Date("2026-11-04T08:00:00.100Z"),
    });

    return { handle, notify };
};

describe("createHandler", () => {
    it("notifies on a threshold violation", async () => {
        const { handle, notify } = build();

        expect(await handle(message(35))).toBe(1);
        expect(notify).toHaveBeenCalledWith(
            expect.objectContaining({ ruleId: "temperature-high", value: 35, latencyMs: 100 }),
        );
    });

    it("does not notify for normal readings", async () => {
        const { handle, notify } = build();

        expect(await handle(message(22))).toBe(0);
        expect(notify).not.toHaveBeenCalled();
    });

    it("de-duplicates repeated violations within the cooldown", async () => {
        const { handle, notify } = build();

        await handle(message(35));
        await handle(message(36));

        expect(notify).toHaveBeenCalledTimes(1);
    });

    it("rejects events that fail contract validation", async () => {
        const { handle } = build();

        await expect(handle(JSON.stringify({ deviceId: "dev-1" }))).rejects.toThrow();
    });

    it("keeps going when a notifier fails", async () => {
        const failing = vi.fn().mockRejectedValue(new Error("down"));
        const working = vi.fn().mockResolvedValue(undefined);
        const handle = createHandler({
            rules: DEFAULT_RULES,
            notifiers: [{ notify: failing }, { notify: working }],
            cooldownMs: 60_000,
            latencyBudgetMs: 1000,
            now: () => new Date("2026-11-04T08:00:00.100Z"),
        });
        vi.spyOn(console, "error").mockImplementation(() => {});

        await handle(message(35));

        expect(working).toHaveBeenCalledTimes(1);
    });
});

describe("WebhookNotifier", () => {
    const alert = {
        ruleId: "r",
        deviceId: "d",
        deviceType: "door",
        field: "f",
        operator: "gt" as const,
        threshold: 1,
        value: 2,
        severity: "info" as const,
        recordedAt: "2026-11-04T08:00:00.000Z",
        triggeredAt: "2026-11-04T08:00:00.000Z",
        latencyMs: 0,
    };

    it("posts the alert as JSON", async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ ok: true });

        await new WebhookNotifier("http://x/alerts", fetchImpl).notify(alert);

        expect(fetchImpl).toHaveBeenCalledWith(
            "http://x/alerts",
            expect.objectContaining({ method: "POST", body: JSON.stringify(alert) }),
        );
    });

    it("throws on a non-2xx response", async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 });

        await expect(new WebhookNotifier("http://x", fetchImpl).notify(alert)).rejects.toThrow("500");
    });
});
