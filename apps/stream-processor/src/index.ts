import { S3Client } from "@aws-sdk/client-s3";
import type { TelemetryRecord } from "@iotflow/shared";
import { Kafka } from "kafkajs";
import { config } from "./config.js";
import { Batcher } from "./lib/batcher.js";
import { createSilverStore } from "./lib/silver-store.js";
import { transformMessage } from "./lib/transformer.js";

const kafka = new Kafka({ clientId: "iotflow-stream-processor", brokers: config.kafka.brokers });
const consumer = kafka.consumer({ groupId: config.kafka.groupId });

const store = createSilverStore(
    new S3Client({
        endpoint: `http://${config.minio.endpoint}:${config.minio.port}`,
        region: config.minio.region,
        credentials: config.minio.credentials,
        forcePathStyle: true,
    }),
    config.minio.bucket,
);

const batcher = new Batcher<TelemetryRecord>(
    async (records) => {
        const keys = await store.writeBatch(records);
        console.log(`[stream-processor] Wrote ${records.length} Silver record(s): ${keys.join(", ")}`);
    },
    config.batchSize,
    config.flushIntervalMs,
);

const start = async () => {
    await store.ensureBucket();

    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: config.kafka.topic }] });
    await admin.disconnect();

    await consumer.connect();
    await consumer.subscribe({ topic: config.kafka.topic, fromBeginning: true });

    console.log(`[stream-processor] Consuming ${config.kafka.topic} -> s3://${config.minio.bucket}`);

    await consumer.run({
        eachMessage: async ({ message }) => {
            if (!message.value) {
                return;
            }

            let record: TelemetryRecord;
            try {
                record = transformMessage(message.value.toString());
            } catch (error) {
                console.error("[stream-processor] Skipping invalid event", error);
                return;
            }

            await batcher.add(record);
        },
    });
};

const shutdown = async (exitCode = 0) => {
    console.log("[stream-processor] Shutting down...");
    try {
        await consumer.disconnect();
        await batcher.flush();
    } catch (error) {
        console.error("[stream-processor] Failed to flush on shutdown", error);
        exitCode = 1;
    }
    process.exit(exitCode);
};

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());

start().catch(async (error) => {
    console.error("[stream-processor] Failed to start", error);
    await shutdown(1);
});
