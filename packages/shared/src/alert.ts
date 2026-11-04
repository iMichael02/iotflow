import { z } from "zod";

export const AlertOperatorSchema = z.enum(["gt", "gte", "lt", "lte", "eq"]);
export const AlertSeveritySchema = z.enum(["info", "warning", "critical"]);

/** Threshold rule evaluated against one numeric field of a device's telemetry. */
export const AlertRuleSchema = z.object({
    id: z.string().min(1),
    deviceType: z.string().min(1),
    field: z.string().min(1),
    operator: AlertOperatorSchema,
    threshold: z.number(),
    severity: AlertSeveritySchema.default("warning"),
    cooldownMs: z.number().int().nonnegative().optional(),
});

/** Alert raised by the hot path when a rule is violated. */
export const AlertSchema = z.object({
    ruleId: z.string().min(1),
    deviceId: z.string().min(1),
    deviceType: z.string().min(1),
    field: z.string().min(1),
    operator: AlertOperatorSchema,
    threshold: z.number(),
    value: z.number(),
    severity: AlertSeveritySchema,
    recordedAt: z.iso.datetime(),
    triggeredAt: z.iso.datetime(),
    /** Milliseconds from the event's receivedAt to the alert being raised. */
    latencyMs: z.number().nonnegative(),
});

export type AlertOperator = z.infer<typeof AlertOperatorSchema>;
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;
export type AlertRule = z.infer<typeof AlertRuleSchema>;
export type Alert = z.infer<typeof AlertSchema>;
