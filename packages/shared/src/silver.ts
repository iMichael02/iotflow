import { z } from "zod";

export const SILVER_SCHEMA_VERSION = "1.0.0";

/**
 * Silver layer record: one validated, normalized telemetry reading.
 *
 * Every device-specific measurement is a nullable column, so records from all
 * device types share one flat shape. The measurement columns mirror the
 * `Telemetry` model in apps/gateway/prisma/schema.prisma; a field a device does
 * not report is normalized to `null`.
 */
export const TelemetryRecordSchema = z.object({
    deviceId: z.string().min(1),
    deviceType: z.string().min(1),
    /** Manifest schema version of the Bronze event this record was derived from (lineage). */
    schemaVersion: z.string().min(1),

    /** When the device recorded the reading (ISO 8601). */
    timestamp: z.iso.datetime(),
    /** When the gateway received the reading (ISO 8601). */
    receivedAt: z.iso.datetime(),

    temperature: z.number().nullable(),
    humidity: z.number().nullable(),
    detected: z.boolean().nullable(),
    state: z.string().nullable(),
    voltage: z.number().nullable(),
    current: z.number().nullable(),
    watts: z.number().nullable(),
});

export type TelemetryRecord = z.infer<typeof TelemetryRecordSchema>;

/** Measurement columns of a Silver record, in storage order. */
export const TELEMETRY_RECORD_MEASUREMENTS = [
    "temperature",
    "humidity",
    "detected",
    "state",
    "voltage",
    "current",
    "watts",
] as const satisfies readonly (keyof TelemetryRecord)[];
