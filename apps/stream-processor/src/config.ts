import "dotenv/config";

export const config = {
    kafka: {
        brokers: (process.env.KAFKA_BROKERS ?? "localhost:9092").split(","),
        topic: process.env.KAFKA_TOPIC ?? "iotflow.telemetry",
        groupId: process.env.KAFKA_GROUP_ID ?? "iotflow-stream-processor",
    },

    minio: {
        endpoint: process.env.MINIO_ENDPOINT ?? "localhost",
        port: parseInt(process.env.MINIO_PORT ?? "9000"),
        region: process.env.MINIO_REGION ?? "us-east-1",
        credentials: {
            accessKeyId: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
            secretAccessKey: process.env.MINIO_SECRET_KEY ?? "minioadminpassword",
        },
        bucket: process.env.MINIO_SILVER_BUCKET ?? "silver",
    },

    batchSize: parseInt(process.env.SILVER_BATCH_SIZE ?? "500"),
    flushIntervalMs: parseInt(process.env.SILVER_FLUSH_INTERVAL_MS ?? "10000"),
};
