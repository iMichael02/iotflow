import { GatewayEventBaseSchema } from "./common";
import { buildManifest, verifyManifest } from "./manifest";
import { DeviceSchemas, DeviceType } from "./registry";

export * from "./alert";
export * from "./manifest";
export * from "./registry";

export const parseGatewayEvent = (input: unknown) => {
    const baseEvent = GatewayEventBaseSchema.parse(input);

    const schema = DeviceSchemas[baseEvent.deviceType as DeviceType];

    if (!schema) {
        throw new Error(`Unsupported device type: ${baseEvent.deviceType}`);
    }

    // Validate a device-supplied manifest, or inject one when absent.
    // The checksum covers the raw data, so it is checked before schema parsing strips keys.
    const manifest = baseEvent.manifest ?? buildManifest(baseEvent);

    if (baseEvent.manifest) {
        verifyManifest(baseEvent.manifest, baseEvent);
    }

    const data = schema.parse(baseEvent.data);

    return {
        ...baseEvent,
        manifest,
        data,
    };
};

export type ParsedGatewayEvent = ReturnType<typeof parseGatewayEvent>;
