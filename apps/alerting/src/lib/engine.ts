import type {
    Alert,
    AlertOperator,
    AlertRule,
    ParsedGatewayEvent,
} from "@iotflow/shared";

export const compare = (
    operator: AlertOperator,
    value: number,
    threshold: number,
): boolean => {
    switch (operator) {
        case "gt":
            return value > threshold;
        case "gte":
            return value >= threshold;
        case "lt":
            return value < threshold;
        case "lte":
            return value <= threshold;
        case "eq":
            return value === threshold;
    }
};

/** Returns an alert for every rule the event violates. */
export const evaluateEvent = (
    event: ParsedGatewayEvent,
    rules: AlertRule[],
    now: Date = new Date(),
): Alert[] => {
    const data = event.data as Record<string, unknown>;
    const alerts: Alert[] = [];

    for (const rule of rules) {
        if (rule.deviceType !== event.deviceType) {
            continue;
        }

        const value = data[rule.field];

        if (typeof value !== "number" || !compare(rule.operator, value, rule.threshold)) {
            continue;
        }

        alerts.push({
            ruleId: rule.id,
            deviceId: event.deviceId,
            deviceType: event.deviceType,
            field: rule.field,
            operator: rule.operator,
            threshold: rule.threshold,
            value,
            severity: rule.severity,
            recordedAt: event.recordedAt,
            triggeredAt: now.toISOString(),
            latencyMs: Math.max(0, now.getTime() - new Date(event.receivedAt).getTime()),
        });
    }

    return alerts;
};

/** Suppresses repeat alerts for the same device and rule within the cooldown window. */
export const createCooldown = (defaultCooldownMs: number) => {
    const lastFired = new Map<string, number>();

    return (alert: Alert, rule: AlertRule | undefined, nowMs: number): boolean => {
        const key = `${alert.deviceId}:${alert.ruleId}`;
        const cooldownMs = rule?.cooldownMs ?? defaultCooldownMs;
        const last = lastFired.get(key);

        if (last !== undefined && nowMs - last < cooldownMs) {
            return false;
        }

        lastFired.set(key, nowMs);

        return true;
    };
};
