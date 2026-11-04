import "dotenv/config";

export const config = {
    kafka: {
        brokers: (process.env.KAFKA_BROKERS ?? "localhost:9092").split(","),
        topic: process.env.KAFKA_TOPIC ?? "iotflow.telemetry",
        groupId: process.env.KAFKA_GROUP_ID ?? "iotflow-alerting",
    },
    rulesPath: process.env.ALERT_RULES_PATH,
    webhookUrl: process.env.ALERT_WEBHOOK_URL,
    cooldownMs: parseInt(process.env.ALERT_COOLDOWN_MS ?? "60000"),
    latencyBudgetMs: parseInt(process.env.ALERT_LATENCY_BUDGET_MS ?? "1000"),
};
