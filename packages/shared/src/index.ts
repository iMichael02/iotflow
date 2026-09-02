import { z } from "zod";
import { GatewayEventBaseSchema } from "./common";
import { DeviceSchemas, DeviceType } from "./registry";

export const parseGatewayEvent = (input: unknown) => {
    const baseEvent = GatewayEventBaseSchema.parse(input);

    const schema = DeviceSchemas[baseEvent.deviceType as DeviceType];

    if (!schema) {
        throw new Error(`Unsupported device type: ${baseEvent.deviceType}`);
    }

    const data = schema.parse(baseEvent.data);

    return {
        ...baseEvent,
        data,
    };
};
