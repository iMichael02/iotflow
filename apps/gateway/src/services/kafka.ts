import { Kafka } from "kafkajs";
import type { ParsedGatewayEvent } from "@iotflow/shared";
import { config } from "../config.js";

const kafka = new Kafka({
    clientId: "iotflow-gateway",
    brokers: config.kafka.brokers,
});

const producer = kafka.producer();

export const connectKafka = async () => {
    const admin = kafka.admin();

    await admin.connect();
    await admin.createTopics({ topics: [{ topic: config.kafka.topic }] });
    await admin.disconnect();

    await producer.connect();

    console.log(`[gateway] Kafka producer ready: ${config.kafka.topic}`);
};

/**
 * Publishes a validated event (with its manifest) to the hot path.
 * Failures are logged, not thrown, so persistence to Bronze/Postgres is never blocked.
 */
export const publishTelemetry = async (event: ParsedGatewayEvent) => {
    try {
        await producer.send({
            topic: config.kafka.topic,
            messages: [{ key: event.deviceId, value: JSON.stringify(event) }],
        });
    } catch (error) {
        console.error("[gateway] Failed to publish to Kafka", error);
    }
};

export const disconnectKafka = async () => {
    await producer.disconnect();
};
