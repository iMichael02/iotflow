import {
    TelemetryRecordSchema,
    TELEMETRY_RECORD_MEASUREMENTS,
    parseGatewayEvent,
    type ParsedGatewayEvent,
    type TelemetryRecord,
} from "@iotflow/shared";

const isType = (value: unknown, type: "number" | "boolean" | "string") =>
    typeof value === type && !(type === "number" && !Number.isFinite(value));

const MEASUREMENT_TYPES = {
    temperature: "number",
    humidity: "number",
    detected: "boolean",
    state: "string",
    voltage: "number",
    current: "number",
    watts: "number",
} as const satisfies Record<(typeof TELEMETRY_RECORD_MEASUREMENTS)[number], string>;

/**
 * Bronze -> Silver: flattens a validated gateway event into one Silver record.
 * Measurements the device did not report (or reported with the wrong type) are normalized to `null`.
 */
export const transformEventToRecord = (event: ParsedGatewayEvent): TelemetryRecord => {
    const data = (event.data ?? {}) as Record<string, unknown>;

    const measurements = Object.fromEntries(
        TELEMETRY_RECORD_MEASUREMENTS.map((field) => [
            field,
            isType(data[field], MEASUREMENT_TYPES[field]) ? data[field] : null,
        ]),
    );

    return TelemetryRecordSchema.parse({
        deviceId: event.deviceId,
        deviceType: event.deviceType,
        schemaVersion: event.manifest.schemaVersion,
        timestamp: event.recordedAt,
        receivedAt: event.receivedAt,
        ...measurements,
    });
};

/** Validates a raw Kafka message (manifest, checksum, device schema), then transforms it. Throws on invalid input. */
export const transformMessage = (raw: string): TelemetryRecord =>
    transformEventToRecord(parseGatewayEvent(JSON.parse(raw)));
