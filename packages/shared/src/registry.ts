import { z } from "zod";
import {
    DoorSchema,
    MotionSchema,
    PowerMeterSchema,
    TemperatureHumiditySchema,
} from "./individualSchemas";

export const DeviceSchemas = {
    temperature_humidity: TemperatureHumiditySchema,

    motion: MotionSchema,

    door: DoorSchema,

    power_meter: PowerMeterSchema,
};

export type DeviceType = keyof typeof DeviceSchemas;
export type DeviceData<T extends DeviceType> = z.infer<
    (typeof DeviceSchemas)[T]
>;
