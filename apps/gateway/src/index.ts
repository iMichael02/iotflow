import mqtt from "mqtt";
import { randomUUID } from "crypto";

import { parseGatewayEvent } from "@iotflow/shared";

import { config } from "./config.js";
import { saveTelemetry } from "./services/telemetry.js";
import { prisma } from "./lib/prisma.js";

const client = mqtt.connect(config.mqttBrokerUrl, {
    clientId: `iotflow-gateway-${randomUUID()}`,
});

const start = async () => {
    try {
        await prisma.$connect();

        console.log("[gateway] Connected to PostgreSQL");

        connectMqtt();
    } catch (error) {
        console.error("[gateway] Failed to start gateway", error);

        await shutdown(1);
    }
};

const connectMqtt = () => {
    client.on("connect", () => {
        console.log(
            `[gateway] Connected to MQTT broker: ${config.mqttBrokerUrl}`,
        );

        client.subscribe(config.mqttTopic, (error) => {
            if (error) {
                console.error(
                    `[gateway] Failed to subscribe to ${config.mqttTopic}`,
                    error,
                );

                return;
            }

            console.log(`[gateway] Subscribed to: ${config.mqttTopic}`);
        });
    });

    client.on("message", async (topic, message) => {
        await handleMessage(topic, message);
    });

    client.on("error", (error) => {
        console.error("[gateway] MQTT error:", error);
    });
};

const handleMessage = async (topic: string, message: Buffer): Promise<void> => {
    try {
        const rawPayload = message.toString();

        console.log(`[gateway] Received message from ${topic}`);

        const parsedPayload = JSON.parse(rawPayload);

        const telemetry = parseGatewayEvent(parsedPayload);

        await saveTelemetry(telemetry);
        console.log(
            `[gateway] Saved telemetry for device ${telemetry.deviceId}`,
        );
    } catch (error) {
        console.error("[gateway] Invalid telemetry event", {
            topic,
            payload: message.toString(),
            error,
        });
    }
};
const shutdown = async (exitCode = 0) => {
    console.log("[gateway] Shutting down...");

    client.end(true);

    await prisma.$disconnect();

    process.exit(exitCode);
};

process.on("SIGINT", () => shutdown());

process.on("SIGTERM", () => shutdown());

start();
