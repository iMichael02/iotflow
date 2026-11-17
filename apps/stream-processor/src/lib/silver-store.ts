import { randomUUID } from "node:crypto";
import {
    CreateBucketCommand,
    HeadBucketCommand,
    PutObjectCommand,
    type S3Client,
} from "@aws-sdk/client-s3";
import { SILVER_SCHEMA_VERSION, type TelemetryRecord } from "@iotflow/shared";
import { encodeParquet } from "./parquet.js";

/** Hive-style partition by UTC day of the reading, e.g. `silver/telemetry/dt=2026-11-03/`. */
export const partitionKey = (record: TelemetryRecord) =>
    `dt=${record.timestamp.slice(0, 10)}`;

export const createSilverStore = (s3: S3Client, bucket: string) => ({
    async ensureBucket() {
        try {
            await s3.send(new HeadBucketCommand({ Bucket: bucket }));
        } catch {
            await s3.send(new CreateBucketCommand({ Bucket: bucket }));
            console.log(`[stream-processor] Created Silver bucket: ${bucket}`);
        }
    },

    /** Writes one Parquet object per day partition present in the batch. Returns the object keys. */
    async writeBatch(records: TelemetryRecord[]): Promise<string[]> {
        const partitions = new Map<string, TelemetryRecord[]>();

        for (const record of records) {
            const key = partitionKey(record);
            partitions.set(key, [...(partitions.get(key) ?? []), record]);
        }

        const keys: string[] = [];

        for (const [partition, partitionRecords] of partitions) {
            const key = `silver/telemetry/${partition}/${Date.now()}-${randomUUID()}.parquet`;

            await s3.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key: key,
                    Body: await encodeParquet(partitionRecords),
                    ContentType: "application/vnd.apache.parquet",
                    // Self-describing, like Bronze objects: schema version and size travel with the object.
                    Metadata: {
                        "schema-version": SILVER_SCHEMA_VERSION,
                        "record-count": String(partitionRecords.length),
                    },
                }),
            );

            keys.push(key);
        }

        return keys;
    },
});

export type SilverStore = ReturnType<typeof createSilverStore>;
