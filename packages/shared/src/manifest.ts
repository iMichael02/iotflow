import { createHash } from "node:crypto";
import { z } from "zod";
import { DeviceSchemas, type DeviceType } from "./registry";

export const CURRENT_SCHEMA_VERSION = "1.0.0";
export const SUPPORTED_SCHEMA_VERSIONS: readonly string[] = [
    CURRENT_SCHEMA_VERSION,
];

export const IntegritySchema = z.object({
    algorithm: z.literal("sha256"),
    checksum: z.string().regex(/^[a-f0-9]{64}$/),
});

/**
 * Manifest header attached to every message. It makes a stream self-describing:
 * schema version, source metadata (device, timestamp, sensor type) and an
 * optional integrity check over the payload data.
 */
export const ManifestSchema = z.object({
    schemaVersion: z.string().min(1),

    deviceId: z.string().min(1),
    deviceType: z.string().min(1),
    recordedAt: z.iso.datetime(),

    integrity: IntegritySchema.optional(),
});

export type Manifest = z.infer<typeof ManifestSchema>;

const canonicalize = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }

    if (value !== null && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
                .map(([key, entry]) => [key, canonicalize(entry)]),
        );
    }

    return value;
};

/** SHA-256 of the payload data with object keys sorted, so key order is irrelevant. */
export const computeChecksum = (data: unknown): string =>
    createHash("sha256")
        .update(JSON.stringify(canonicalize(data)))
        .digest("hex");

export const buildManifest = (source: {
    deviceId: string;
    deviceType: string;
    recordedAt: string;
    data: unknown;
}): Manifest => ({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    deviceId: source.deviceId,
    deviceType: source.deviceType,
    recordedAt: source.recordedAt,
    integrity: {
        algorithm: "sha256",
        checksum: computeChecksum(source.data),
    },
});

/**
 * Validates a manifest against the event it accompanies.
 * Throws if the schema version is unsupported, the source metadata does not
 * match the event, or the checksum does not match the payload data.
 */
export const verifyManifest = (
    manifest: Manifest,
    source: {
        deviceId: string;
        deviceType: string;
        recordedAt: string;
        data: unknown;
    },
): void => {
    if (!SUPPORTED_SCHEMA_VERSIONS.includes(manifest.schemaVersion)) {
        throw new Error(
            `Unsupported manifest schema version: ${manifest.schemaVersion}`,
        );
    }

    for (const field of ["deviceId", "deviceType", "recordedAt"] as const) {
        if (manifest[field] !== source[field]) {
            throw new Error(`Manifest ${field} does not match event`);
        }
    }

    if (
        manifest.integrity &&
        manifest.integrity.checksum !== computeChecksum(source.data)
    ) {
        throw new Error("Manifest checksum does not match payload data");
    }
};

/** Resolves the payload schema a manifest declares, so consumers need no manual configuration. */
export const resolveManifestSchema = (manifest: Manifest) => {
    if (!SUPPORTED_SCHEMA_VERSIONS.includes(manifest.schemaVersion)) {
        throw new Error(
            `Unsupported manifest schema version: ${manifest.schemaVersion}`,
        );
    }

    const schema = DeviceSchemas[manifest.deviceType as DeviceType];

    if (!schema) {
        throw new Error(`Unsupported device type: ${manifest.deviceType}`);
    }

    return schema;
};

/** Bronze object layout: the manifest header plus the untouched device payload. */
export const BronzeEnvelopeSchema = z.object({
    manifest: ManifestSchema,
    payload: z.unknown(),
});

export type BronzeEnvelope = z.infer<typeof BronzeEnvelopeSchema>;

/**
 * Parses a Bronze object using only its manifest: verifies the manifest,
 * then validates the payload data with the schema the manifest declares.
 */
export const parseBronzeEnvelope = (input: unknown) => {
    const { manifest, payload } = BronzeEnvelopeSchema.parse(input);

    const event = z
        .object({
            deviceId: z.string(),
            deviceType: z.string(),
            recordedAt: z.string(),
            data: z.unknown(),
        })
        .passthrough()
        .parse(payload);

    verifyManifest(manifest, event);

    return {
        manifest,
        event: { ...event, data: resolveManifestSchema(manifest).parse(event.data) },
    };
};
