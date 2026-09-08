import { describe, it, expect } from "vitest";
import { parseGatewayEvent } from "../src/index";

const baseFields = {
    deviceId: "device-1",
    recordedAt: "2026-09-08T12:00:00.000Z",
    receivedAt: "2026-09-08T12:00:01.000Z",
    topic: "sensors/temperature",
};

describe("parseGatewayEvent", () => {
    it("parses a valid temperature_humidity event", () => {
        const event = {
            ...baseFields,
            deviceType: "temperature_humidity",
            data: { temperature: 21.5, humidity: 55 },
        };

        expect(parseGatewayEvent(event)).toEqual({
            ...baseFields,
            deviceType: "temperature_humidity",
            data: { temperature: 21.5, humidity: 55 },
        });
    });

    it("parses a valid motion event", () => {
        const event = {
            ...baseFields,
            deviceType: "motion",
            data: { detected: true },
        };

        expect(parseGatewayEvent(event)).toEqual({
            ...baseFields,
            deviceType: "motion",
            data: { detected: true },
        });
    });

    it("throws when the base event shape is invalid", () => {
        const event = {
            ...baseFields,
            deviceId: "",
            deviceType: "motion",
            data: { detected: true },
        };

        expect(() => parseGatewayEvent(event)).toThrow();
    });

    it("throws for an unsupported device type", () => {
        const event = {
            ...baseFields,
            deviceType: "unknown_device",
            data: {},
        };

        expect(() => parseGatewayEvent(event)).toThrow(
            "Unsupported device type: unknown_device",
        );
    });

    it("throws when the device-specific data fails validation", () => {
        const event = {
            ...baseFields,
            deviceType: "temperature_humidity",
            data: { temperature: 21.5, humidity: 150 },
        };

        expect(() => parseGatewayEvent(event)).toThrow();
    });
});
