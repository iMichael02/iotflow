import type { GatewayEventBase } from "@iotflow/shared/src/common";
import type { DeviceType } from "@prisma/client";
import {
    S3Client,
    PutObjectCommand,
    CreateBucketCommand,
    HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";

const s3Client = new S3Client({
    endpoint: `http://${config.minio.endpoint}:${config.minio.port}`,
    region: config.minio.region,
    credentials: config.minio.credentials,
    forcePathStyle: true,
});

export const ensureBronzeBucket = async () => {
    try {
        await s3Client.send(new HeadBucketCommand({ Bucket: config.minio.bucket }));
    } catch {
        await s3Client.send(new CreateBucketCommand({ Bucket: config.minio.bucket }));
        console.log(`[gateway] Created Bronze bucket: ${config.minio.bucket}`);
    }
};

export const saveTelemetry = async (event: GatewayEventBase, rawPayload: string) => {
    const { deviceId, deviceType, recordedAt, receivedAt, data } = event;

    const {
        temperature = null,
        humidity = null,
        detected = null,
        state = null,
        voltage = null,
        current = null,
        watts = null,
    } = data as any;

    // 1. Save to Bronze Layer (MinIO)
    const objectKey = `bronze/${deviceId}/${recordedAt}/${Date.now()}.json`;

    try {
        await s3Client.send(
            new PutObjectCommand({
                Bucket: config.minio.bucket,
                Key: objectKey,
                Body: rawPayload,
                ContentType: "application/json",
            }),
        );
        console.log(`[gateway] Saved raw payload to Bronze layer: ${objectKey}`);
    } catch (error) {
        console.error("[gateway] Failed to save to Bronze layer", error);
        // We don't throw here because we still want to attempt saving to PostgreSQL (Silver/Gold path)
        // depending on the business requirements. For "First Drop", we want to see progress.
    }

    // 2. Save to Silver/Gold Layer (PostgreSQL)
    const device = await prisma.device.upsert({
        where: {
            deviceId: deviceId,
        },

        update: {
            status: "ONLINE",
        },

        create: {
            deviceId: deviceId,
            name: deviceId,
            deviceType: deviceType as DeviceType,
            status: "ONLINE",
        },
    });

    const telemetry = await prisma.telemetry.create({
        data: {
            temperature,
            humidity,
            detected,
            state,
            voltage,
            current,
            watts,

            recordedAt,
            receivedAt,

            deviceId: device.id,
        },
    });

    return {
        device,
        telemetry,
    };
};
