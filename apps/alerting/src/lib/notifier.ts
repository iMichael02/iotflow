import type { Alert } from "@iotflow/shared";

export interface Notifier {
    notify(alert: Alert): Promise<void>;
}

export class ConsoleNotifier implements Notifier {
    async notify(alert: Alert): Promise<void> {
        console.warn(
            `[alerting] ALERT ${alert.severity.toUpperCase()} ${alert.ruleId}: ` +
                `${alert.deviceId} ${alert.field}=${alert.value} ` +
                `(${alert.operator} ${alert.threshold}) latency=${alert.latencyMs}ms`,
        );
    }
}

/** POSTs each alert as JSON to an external alerting service. */
export class WebhookNotifier implements Notifier {
    constructor(
        private readonly url: string,
        private readonly fetchImpl: typeof fetch = fetch,
    ) {}

    async notify(alert: Alert): Promise<void> {
        const response = await this.fetchImpl(this.url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(alert),
        });

        if (!response.ok) {
            throw new Error(`Webhook responded with ${response.status}`);
        }
    }
}
