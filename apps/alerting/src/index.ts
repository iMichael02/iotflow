import { Kafka } from "kafkajs";
import { config } from "./config.js";
import { createHandler } from "./lib/handler.js";
import { ConsoleNotifier, WebhookNotifier, type Notifier } from "./lib/notifier.js";
import { loadRules } from "./lib/rules.js";

const kafka = new Kafka({ clientId: "iotflow-alerting", brokers: config.kafka.brokers });
const consumer = kafka.consumer({ groupId: config.kafka.groupId });

const start = async () => {
    const rules = await loadRules(config.rulesPath);

    const notifiers: Notifier[] = [new ConsoleNotifier()];
    if (config.webhookUrl) {
        notifiers.push(new WebhookNotifier(config.webhookUrl));
    }

    const handle = createHandler({
        rules,
        notifiers,
        cooldownMs: config.cooldownMs,
        latencyBudgetMs: config.latencyBudgetMs,
    });

    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: config.kafka.topic }] });
    await admin.disconnect();

    await consumer.connect();
    await consumer.subscribe({ topic: config.kafka.topic, fromBeginning: false });

    console.log(
        `[alerting] Watching ${config.kafka.topic} with ${rules.length} rule(s)`,
    );

    await consumer.run({
        eachMessage: async ({ message }) => {
            if (!message.value) {
                return;
            }

            try {
                await handle(message.value.toString());
            } catch (error) {
                console.error("[alerting] Skipping invalid event", error);
            }
        },
    });
};

const shutdown = async (exitCode = 0) => {
    console.log("[alerting] Shutting down...");
    await consumer.disconnect();
    process.exit(exitCode);
};

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());

start().catch(async (error) => {
    console.error("[alerting] Failed to start", error);
    await shutdown(1);
});
