import { parseGatewayEvent, type AlertRule } from "@iotflow/shared";
import { createCooldown, evaluateEvent } from "./engine.js";
import type { Notifier } from "./notifier.js";

/** Builds the per-message handler: parse, evaluate rules, de-duplicate, notify. */
export const createHandler = (options: {
    rules: AlertRule[];
    notifiers: Notifier[];
    cooldownMs: number;
    latencyBudgetMs: number;
    now?: () => Date;
}) => {
    const shouldFire = createCooldown(options.cooldownMs);
    const rulesById = new Map(options.rules.map((rule) => [rule.id, rule]));
    const now = options.now ?? (() => new Date());

    return async (rawMessage: string): Promise<number> => {
        const event = parseGatewayEvent(JSON.parse(rawMessage));
        const current = now();
        let fired = 0;

        for (const alert of evaluateEvent(event, options.rules, current)) {
            if (!shouldFire(alert, rulesById.get(alert.ruleId), current.getTime())) {
                continue;
            }

            if (alert.latencyMs > options.latencyBudgetMs) {
                console.warn(
                    `[alerting] Latency budget exceeded: ${alert.latencyMs}ms > ${options.latencyBudgetMs}ms`,
                );
            }

            await Promise.all(
                options.notifiers.map((notifier) =>
                    notifier.notify(alert).catch((error) => {
                        console.error("[alerting] Notifier failed", error);
                    }),
                ),
            );

            fired += 1;
        }

        return fired;
    };
};
