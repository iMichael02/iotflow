import { z } from "zod";
import { ManifestSchema } from "./manifest";

export const GatewayEventBaseSchema = z.object({
    deviceId: z.string().min(1),

    recordedAt: z.iso.datetime(),
    receivedAt: z.iso.datetime(),

    topic: z.string().min(1),

    deviceType: z.string().min(1),

    data: z.unknown(),

    manifest: ManifestSchema.optional(),
});

export type GatewayEventBase = z.infer<typeof GatewayEventBaseSchema>;
