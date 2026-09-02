import "dotenv/config";

export const config = {
    mqttBrokerUrl: process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883",

    mqttTopic: process.env.MQTT_TOPIC ?? "iotflow/devices/+/telemetry",
};
