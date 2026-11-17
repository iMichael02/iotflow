import { describe, expect, it } from "vitest";
import { ParquetReader } from "@dsnp/parquetjs";
import type { S3Client } from "@aws-sdk/client-s3";
import { parseGatewayEvent, type TelemetryRecord } from "@iotflow/shared";
import { encodeParquet } from "../src/lib/parquet";
import { createSilverStore, partitionKey } from "../src/lib/silver-store";
import { transformMessage } from "../src/lib/transformer";

const readParquet = async (buffer: Buffer) => {
    const reader = await ParquetReader.openBuffer(buffer);
    const cursor = reader.getCursor();
    const rows: Record<string, unknown>[] = [];

    for (let row = await cursor.next(); row; row = await cursor.next()) {
        rows.push(row);
    }

    await reader.close();
    return rows;
};

const record = (overrides: Partial<TelemetryRecord> = {}): TelemetryRecord => ({
    deviceId: "dev-1",
    deviceType: "temperature_humidity",
    schemaVersion: "1.0.0",
    timestamp: "2026-11-03T08:00:00.000Z",
    receivedAt: "2026-11-03T08:00:00.120Z",
    temperature: 21.5,
    humidity: 50,
    detected: null,
    state: null,
    voltage: null,
    current: null,
    watts: null,
    ...overrides,
});

describe("encodeParquet", () => {
    it("round-trips records, preserving nulls and timestamps", async () => {
        const rows = await readParquet(
            await encodeParquet([record(), record({ deviceType: "door", temperature: null, humidity: null, state: "open" })]),
        );

        expect(rows).toHaveLength(2);
        expect(rows[0]).toMatchObject({ deviceId: "dev-1", temperature: 21.5, humidity: 50 });
        expect(rows[0]!.timestamp).toEqual(new Date("2026-11-03T08:00:00.000Z"));
        expect(rows[0]!.state ?? null).toBeNull();
        expect(rows[1]).toMatchObject({ deviceType: "door", state: "open" });
        expect(rows[1]!.temperature ?? null).toBeNull();
    });
});

describe("silver store", () => {
    const fakeS3 = () => {
        const puts: { Key: string; Body: Buffer; Metadata: Record<string, string> }[] = [];
        const s3 = { send: async (command: { input: never }) => void puts.push(command.input) } as unknown as S3Client;
        return { s3, puts };
    };

    it("partitions by UTC day of the reading", () => {
        expect(partitionKey(record({ timestamp: "2026-11-03T23:59:59.000Z" }))).toBe("dt=2026-11-03");
    });

    it("writes one self-describing Parquet object per day partition", async () => {
        const { s3, puts } = fakeS3();
        const store = createSilverStore(s3, "silver");

        const keys = await store.writeBatch([
            record(),
            record({ timestamp: "2026-11-04T00:00:01.000Z" }),
            record({ timestamp: "2026-11-04T00:00:02.000Z" }),
        ]);

        expect(keys).toHaveLength(2);
        expect(puts[0]!.Key).toMatch(/^silver\/telemetry\/dt=2026-11-03\/.+\.parquet$/);
        expect(puts[1]!.Key).toMatch(/^silver\/telemetry\/dt=2026-11-04\//);
        expect(puts[1]!.Metadata).toEqual({ "schema-version": "1.0.0", "record-count": "2" });
    });

    it("takes a simulated device event from the Kafka topic to a Silver Parquet object", async () => {
        // Same shape the gateway publishes to Kafka: a parsed event with its manifest.
        const published = JSON.stringify(
            parseGatewayEvent({
                deviceId: "sim-1",
                deviceType: "power_meter",
                recordedAt: "2026-11-03T08:00:00.000Z",
                receivedAt: "2026-11-03T08:00:00.050Z",
                topic: "iotflow/devices/sim-1/telemetry",
                data: { voltage: 229.8, current: 2, watts: 459.6 },
            }),
        );

        const { s3, puts } = fakeS3();
        await createSilverStore(s3, "silver").writeBatch([transformMessage(published)]);

        const rows = await readParquet(puts[0]!.Body);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            deviceId: "sim-1",
            deviceType: "power_meter",
            voltage: 229.8,
            current: 2,
            watts: 459.6,
        });
        expect(rows[0]!.temperature ?? null).toBeNull();
    });
});
