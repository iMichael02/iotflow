import { describe, expect, it } from "vitest";
import { parseGatewayEvent } from "../src/index";

const baseFields = {
    deviceId: "device-123",
    recordedAt: "2024-09-03T12:00:00.000Z",
    receivedAt: "2024-09-03T12:00:00.100Z",
    topic: "sensors/device-123",
};

describe("parseGatewayEvent", () => {
    it("parses a valid temperature_humidity event", () => {
        const input = {
            ...baseFields,
            deviceType: "temperature_humidity",
            data: { temperature: 22.5, humidity: 45 },
        };

        expect(parseGatewayEvent(input)).toEqual({
            ...baseFields,
            deviceType: "temperature_humidity",
            data: { temperature: 22.5, humidity: 45 },
        });
    });

    it("parses a valid door event", () => {
        const input = {
            ...baseFields,
            deviceType: "door",
            data: { state: "open" },
        };

        expect(parseGatewayEvent(input)).toEqual({
            ...baseFields,
            deviceType: "door",
            data: { state: "open" },
        });
    });

    it("throws when the base event shape is invalid", () => {
        const input = {
            ...baseFields,
            deviceId: "",
            deviceType: "door",
            data: { state: "open" },
        };

        expect(() => parseGatewayEvent(input)).toThrow();
    });

    it("throws for an unsupported device type", () => {
        const input = {
            ...baseFields,
            deviceType: "unknown_device",
            data: {},
        };

        expect(() => parseGatewayEvent(input)).toThrow(
            "Unsupported device type: unknown_device",
        );
    });

    it("throws when device-specific data fails validation", () => {
        const input = {
            ...baseFields,
            deviceType: "motion",
            data: { detected: "yes" },
        };

        expect(() => parseGatewayEvent(input)).toThrow();
    });
});
