import { describe, it, expect } from "vitest";
import {
    buildManifest,
    computeChecksum,
    parseBronzeEnvelope,
    resolveManifestSchema,
    DeviceSchemas,
} from "../src/index";

const recordedAt = "2026-11-03T08:00:00.000Z";
const payload = {
    deviceId: "dev-1",
    deviceType: "door",
    recordedAt,
    data: { state: "open" },
};

describe("computeChecksum", () => {
    it("is independent of object key order", () => {
        expect(computeChecksum({ a: 1, b: { c: 2, d: 3 } })).toBe(
            computeChecksum({ b: { d: 3, c: 2 }, a: 1 }),
        );
    });

    it("changes when the data changes", () => {
        expect(computeChecksum({ a: 1 })).not.toBe(computeChecksum({ a: 2 }));
    });
});

describe("resolveManifestSchema", () => {
    it("returns the payload schema declared by the manifest", () => {
        expect(resolveManifestSchema(buildManifest(payload))).toBe(DeviceSchemas.door);
    });

    it("throws for an unknown device type", () => {
        expect(() =>
            resolveManifestSchema({ ...buildManifest(payload), deviceType: "toaster" }),
        ).toThrow("Unsupported device type");
    });
});

describe("parseBronzeEnvelope", () => {
    it("parses a Bronze object using only its manifest", () => {
        const result = parseBronzeEnvelope({ manifest: buildManifest(payload), payload });

        expect(result.event.data).toEqual({ state: "open" });
    });

    it("rejects a tampered payload", () => {
        const tampered = { ...payload, data: { state: "closed" } };

        expect(() =>
            parseBronzeEnvelope({ manifest: buildManifest(payload), payload: tampered }),
        ).toThrow("checksum");
    });

    it("rejects payload data that violates the declared schema", () => {
        const bad = { ...payload, data: { state: "ajar" } };

        expect(() =>
            parseBronzeEnvelope({ manifest: buildManifest(bad), payload: bad }),
        ).toThrow();
    });
});
