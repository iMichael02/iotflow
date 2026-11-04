import { readFile } from "node:fs/promises";
import { z } from "zod";
import { AlertRuleSchema, type AlertRule } from "@iotflow/shared";

export const DEFAULT_RULES: AlertRule[] = [
    {
        id: "temperature-high",
        deviceType: "temperature_humidity",
        field: "temperature",
        operator: "gt",
        threshold: 30,
        severity: "critical",
    },
    {
        id: "humidity-high",
        deviceType: "temperature_humidity",
        field: "humidity",
        operator: "gt",
        threshold: 85,
        severity: "warning",
    },
    {
        id: "power-draw-high",
        deviceType: "power_meter",
        field: "watts",
        operator: "gt",
        threshold: 3000,
        severity: "warning",
    },
];

/** Loads rules from a JSON file, or returns the built-in defaults when no path is given. */
export const loadRules = async (path?: string): Promise<AlertRule[]> => {
    if (!path) {
        return DEFAULT_RULES;
    }

    const contents = await readFile(path, "utf8");

    return z.array(AlertRuleSchema).parse(JSON.parse(contents));
};
