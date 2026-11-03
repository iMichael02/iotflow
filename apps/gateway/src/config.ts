import "dotenv/config";

export const config = {
    mqttBrokerUrl: process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883",
    mqttTopic: process.env.MQTT_TOPIC ?? "iotflow/devices/+/telemetry",

    minio: {
        endpoint: process.env.MINIO_ENDPOINT ?? "localhost",
        port: parseInt(process.env.MINIO_PORT ?? "9000"),
        region: process.env.MINIO_REGION ?? "us-east-1",
        credentials: {
            accessKeyId: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
            secretAccessKey: process.env.MINIO_SECRET_KEY ?? "minioadminpassword",
        },
        bucket: process.env.MINIO_BUCKET ?? "bronze",
    },
};
