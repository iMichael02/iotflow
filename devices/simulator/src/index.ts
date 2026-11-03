import "dotenv/config";
import mqtt from "mqtt";
import type { DeviceType } from "@iotflow/shared/src/registry";

const mqttBrokerUrl = process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883";
const deviceId = process.env.DEVICE_ID ?? "sim-temp-humidity-001";
const deviceType: DeviceType = "temperature_humidity";
const intervalMs = parseInt(process.env.SIMULATOR_INTERVAL_MS ?? "5000");

const topic = `iotflow/devices/${deviceId}/telemetry`;

const buildPayload = () => {
    const now = new Date().toISOString();

    return {
        deviceId,
        deviceType,
        recordedAt: now,
        receivedAt: now,
        topic,
        data: {
            temperature: 20 + Math.random() * 15,
            humidity: 40 + Math.random() * 50,
        },
    };
};

const client = mqtt.connect(mqttBrokerUrl, {
    clientId: `iotflow-simulator-${deviceId}`,
});

client.on("connect", () => {
    console.log(`[simulator] Connected to MQTT broker: ${mqttBrokerUrl}`);
    console.log(`[simulator] Publishing as ${deviceId} on ${topic} every ${intervalMs}ms`);

    setInterval(() => {
        const payload = buildPayload();

        client.publish(topic, JSON.stringify(payload));

        console.log(`[simulator] Published`, payload);
    }, intervalMs);
});

client.on("error", (error) => {
    console.error("[simulator] MQTT error:", error);
});

process.on("SIGINT", () => client.end(true, {}, () => process.exit(0)));
process.on("SIGTERM", () => client.end(true, {}, () => process.exit(0)));
