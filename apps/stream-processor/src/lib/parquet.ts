import { Writable } from "node:stream";
import { ParquetSchema, ParquetWriter } from "@dsnp/parquetjs";
import type { TelemetryRecord } from "@iotflow/shared";

export const SILVER_PARQUET_SCHEMA = new ParquetSchema({
    deviceId: { type: "UTF8" },
    deviceType: { type: "UTF8" },
    schemaVersion: { type: "UTF8" },
    timestamp: { type: "TIMESTAMP_MILLIS" },
    receivedAt: { type: "TIMESTAMP_MILLIS" },
    temperature: { type: "DOUBLE", optional: true },
    humidity: { type: "DOUBLE", optional: true },
    detected: { type: "BOOLEAN", optional: true },
    state: { type: "UTF8", optional: true },
    voltage: { type: "DOUBLE", optional: true },
    current: { type: "DOUBLE", optional: true },
    watts: { type: "DOUBLE", optional: true },
});

/** Encodes Silver records as a single in-memory Parquet file. `null` measurements are stored as nulls. */
export const encodeParquet = async (records: TelemetryRecord[]): Promise<Buffer> => {
    const chunks: Buffer[] = [];
    const sink = new Writable({
        write(chunk, _encoding, callback) {
            chunks.push(Buffer.from(chunk));
            callback();
        },
    });

    const writer = await ParquetWriter.openStream(
        SILVER_PARQUET_SCHEMA,
        sink as unknown as Parameters<typeof ParquetWriter.openStream>[1],
    );

    for (const record of records) {
        await writer.appendRow({
            ...record,
            timestamp: new Date(record.timestamp),
            receivedAt: new Date(record.receivedAt),
        });
    }

    await writer.close();

    return Buffer.concat(chunks);
};
