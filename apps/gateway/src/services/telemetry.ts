import type { GatewayEventBase } from "@iotflow/shared/src/common";

import { prisma } from "../lib/prisma.js";

export const saveTelemetry = async (event: GatewayEventBase) => {
    const { deviceId, recordedAt, receivedAt, data } = event;

    const {
        temperature = null,
        humidity = null,
        detected = null,
        state = null,
        voltage = null,
        current = null,
        watts = null,
    } = data as any;

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
            deviceType: "",
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
