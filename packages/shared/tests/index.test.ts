import { describe, it, expect } from "vitest";
import {
    parseGatewayEvent,
    buildManifest,
    CURRENT_SCHEMA_VERSION,
    AlertRuleSchema,
    AlertSchema,
} from "../src/index";

const recordedAt = "2026-11-03T08:00:00.000Z";

const baseEvent = () => ({
    deviceId: "dev-1",
    deviceType: "temperature_humidity",
    recordedAt,
    receivedAt: recordedAt,
    topic: "iotflow/devices/dev-1/telemetry",
    data: { temperature: 21.5, humidity: 50 },
});

describe("parseGatewayEvent", () => {
    it("parses an event and injects a manifest when none is supplied", () => {
        const result = parseGatewayEvent(baseEvent());

        expect(result.data).toEqual({ temperature: 21.5, humidity: 50 });
        expect(result.manifest).toMatchObject({
            schemaVersion: CURRENT_SCHEMA_VERSION,
            deviceId: "dev-1",
            deviceType: "temperature_humidity",
            recordedAt,
            integrity: { algorithm: "sha256" },
        });
    });

    it("accepts a valid device-supplied manifest", () => {
        const event = baseEvent();
        const manifest = buildManifest(event);

        const result = parseGatewayEvent({ ...event, manifest });

        expect(result.manifest).toEqual(manifest);
    });

    it("rejects a manifest whose checksum does not match the data", () => {
        const event = baseEvent();
        const manifest = buildManifest(event);

        expect(() =>
            parseGatewayEvent({ ...event, manifest, data: { temperature: 99, humidity: 50 } }),
        ).toThrow("checksum");
    });

    it("rejects a manifest with an unsupported schema version", () => {
        const event = baseEvent();
        const manifest = { ...buildManifest(event), schemaVersion: "9.9.9" };

        expect(() => parseGatewayEvent({ ...event, manifest })).toThrow("schema version");
    });

    it("rejects a manifest whose source metadata does not match the event", () => {
        const event = baseEvent();
        const manifest = { ...buildManifest(event), deviceId: "other" };

        expect(() => parseGatewayEvent({ ...event, manifest })).toThrow("deviceId");
    });

    it("rejects an unsupported device type", () => {
        expect(() => parseGatewayEvent({ ...baseEvent(), deviceType: "toaster" })).toThrow(
            "Unsupported device type",
        );
    });
});

describe("alert contract", () => {
    it("applies the default severity to a rule", () => {
        const rule = AlertRuleSchema.parse({
            id: "r1",
            deviceType: "temperature_humidity",
            field: "temperature",
            operator: "gt",
            threshold: 30,
        });

        expect(rule.severity).toBe("warning");
    });

    it("rejects a rule with an unknown operator", () => {
        expect(() =>
            AlertRuleSchema.parse({
                id: "r1",
                deviceType: "door",
                field: "x",
                operator: "between",
                threshold: 1,
            }),
        ).toThrow();
    });

    it("parses a well-formed alert", () => {
        expect(
            AlertSchema.parse({
                ruleId: "r1",
                deviceId: "dev-1",
                deviceType: "temperature_humidity",
                field: "temperature",
                operator: "gt",
                threshold: 30,
                value: 35,
                severity: "critical",
                recordedAt,
                triggeredAt: recordedAt,
                latencyMs: 12,
            }).value,
        ).toBe(35);
    });
});
