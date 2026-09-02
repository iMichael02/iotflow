import { z } from "zod";

export const TemperatureHumiditySchema = z.object({
    temperature: z.number(),
    humidity: z.number().min(0).max(100),
});

export const MotionSchema = z.object({
    detected: z.boolean(),
});

export const DoorSchema = z.object({
    state: z.enum(["open", "closed"]),
});

export const PowerMeterSchema = z.object({
    voltage: z.number().nonnegative(),
    current: z.number().nonnegative(),
    watts: z.number().nonnegative(),
});
