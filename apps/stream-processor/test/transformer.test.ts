import { describe, it, expect } from "vitest";
import { buildManifest, parseGatewayEvent, SILVER_SCHEMA_VERSION } from "@iotflow/shared";
import { transformEventToRecord, transformMessage } from "../src/lib/transformer";

const recordedAt = "2026-11-03T08:00:00.000Z";
const receivedAt = "2026-11-03T08:00:00.120Z";

const rawEvent = (deviceType: string, data: unknown) => ({
    deviceId: "dev-1",
    deviceType,
    recordedAt,
    receivedAt,
    topic: "iotflow/devices/dev-1/telemetry",
    data,
});

describe("transformEventToRecord", () => {
    it("maps a valid event to a Silver record", () => {
        const event = parseGatewayEvent(rawEvent("temperature_humidity", { temperature: 22.5, humidity: 45 }));

        expect(transformEventToRecord(event)).toEqual({
            deviceId: "dev-1",
            deviceType: "temperature_humidity",
            schemaVersion: "1.0.0",
            timestamp: recordedAt,
            receivedAt,
            temperature: 22.5,
            humidity: 45,
            detected: null,
            state: null,
            voltage: null,
            current: null,
            watts: null,
        });
    });

    it("normalizes fields the device does not report to null", () => {
        const event = parseGatewayEvent(rawEvent("door", { state: "open" }));
        const record = transformEventToRecord(event);

        expect(record.state).toBe("open");
        expect(record).toMatchObject({
            temperature: null,
            humidity: null,
            detected: null,
            voltage: null,
            current: null,
            watts: null,
        });
    });

    it("keeps falsy but valid readings (0 and false) rather than nulling them", () => {
        const motion = transformEventToRecord(parseGatewayEvent(rawEvent("motion", { detected: false })));
        const power = transformEventToRecord(
            parseGatewayEvent(rawEvent("power_meter", { voltage: 0, current: 0, watts: 0 })),
        );

        expect(motion.detected).toBe(false);
        expect(power).toMatchObject({ voltage: 0, current: 0, watts: 0 });
    });

    it("normalizes a non-finite or wrongly typed measurement to null", () => {
        const event = {
            ...parseGatewayEvent(rawEvent("temperature_humidity", { temperature: 1, humidity: 1 })),
            data: { temperature: "hot", humidity: Number.NaN },
        } as ReturnType<typeof parseGatewayEvent>;

        expect(transformEventToRecord(event)).toMatchObject({ temperature: null, humidity: null });
    });

    it("takes the schema version from the event manifest", () => {
        const event = parseGatewayEvent(rawEvent("door", { state: "closed" }));

        expect(transformEventToRecord(event).schemaVersion).toBe(event.manifest.schemaVersion);
        expect(SILVER_SCHEMA_VERSION).toBe("1.0.0");
    });
});

describe("transformMessage", () => {
    it("validates and transforms a raw Kafka message as published by the gateway", () => {
        const event = parseGatewayEvent(rawEvent("power_meter", { voltage: 230, current: 1.5, watts: 345 }));

        expect(transformMessage(JSON.stringify(event))).toMatchObject({
            deviceId: "dev-1",
            voltage: 230,
            current: 1.5,
            watts: 345,
        });
    });

    it("rejects a message whose payload fails the device schema", () => {
        const event = rawEvent("temperature_humidity", { temperature: 20, humidity: 500 });

        expect(() => transformMessage(JSON.stringify(event))).toThrow();
    });

    it("rejects a message whose manifest checksum does not match the data", () => {
        const event = rawEvent("door", { state: "open" });
        const manifest = buildManifest(event);

        expect(() =>
            transformMessage(JSON.stringify({ ...event, manifest, data: { state: "closed" } })),
        ).toThrow("checksum");
    });

    it("rejects malformed JSON", () => {
        expect(() => transformMessage("{not json")).toThrow();
    });
});
