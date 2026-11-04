import { describe, it, expect } from "vitest";
import { parseGatewayEvent, type AlertRule } from "@iotflow/shared";
import { compare, createCooldown, evaluateEvent } from "../src/lib/engine";

const receivedAt = "2026-11-04T08:00:00.000Z";

const tempEvent = (temperature: number) =>
    parseGatewayEvent({
        deviceId: "dev-1",
        deviceType: "temperature_humidity",
        recordedAt: receivedAt,
        receivedAt,
        topic: "iotflow/devices/dev-1/telemetry",
        data: { temperature, humidity: 50 },
    });

const rule: AlertRule = {
    id: "temperature-high",
    deviceType: "temperature_humidity",
    field: "temperature",
    operator: "gt",
    threshold: 30,
    severity: "critical",
};

describe("compare", () => {
    it.each([
        ["gt", 31, 30, true],
        ["gt", 30, 30, false],
        ["gte", 30, 30, true],
        ["lt", 29, 30, true],
        ["lte", 31, 30, false],
        ["eq", 30, 30, true],
    ] as const)("%s %d vs %d is %s", (operator, value, threshold, expected) => {
        expect(compare(operator, value, threshold)).toBe(expected);
    });
});

describe("evaluateEvent", () => {
    it("raises an alert with latency when a threshold is violated", () => {
        const now = new Date("2026-11-04T08:00:00.250Z");

        const alerts = evaluateEvent(tempEvent(35), [rule], now);

        expect(alerts).toHaveLength(1);
        expect(alerts[0]).toMatchObject({
            ruleId: "temperature-high",
            deviceId: "dev-1",
            value: 35,
            severity: "critical",
            latencyMs: 250,
        });
    });

    it("raises nothing when the value is within bounds", () => {
        expect(evaluateEvent(tempEvent(25), [rule])).toEqual([]);
    });

    it("ignores rules for other device types", () => {
        expect(
            evaluateEvent(tempEvent(35), [{ ...rule, deviceType: "power_meter" }]),
        ).toEqual([]);
    });

    it("ignores rules whose field is absent from the data", () => {
        expect(evaluateEvent(tempEvent(35), [{ ...rule, field: "watts" }])).toEqual([]);
    });
});

describe("createCooldown", () => {
    it("suppresses repeats inside the window and fires again after it", () => {
        const [alert] = evaluateEvent(tempEvent(35), [rule]);
        const shouldFire = createCooldown(1000);

        expect(shouldFire(alert, rule, 0)).toBe(true);
        expect(shouldFire(alert, rule, 500)).toBe(false);
        expect(shouldFire(alert, rule, 1000)).toBe(true);
    });

    it("prefers the rule's own cooldown", () => {
        const [alert] = evaluateEvent(tempEvent(35), [rule]);
        const shouldFire = createCooldown(1000);
        const short = { ...rule, cooldownMs: 100 };

        expect(shouldFire(alert, short, 0)).toBe(true);
        expect(shouldFire(alert, short, 150)).toBe(true);
    });
});
