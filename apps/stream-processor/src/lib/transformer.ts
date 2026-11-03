import { z } from 'zod';
import { GatewayEventBaseSchema } from '@iotflow/shared/src/common';

// This is a simplified version for testing/implementation purposes
// In a real app, we'd import from the actual shared package
export const TelemetryRecordSchema = z.object({
  deviceId: z.string(),
  timestamp: z.number(),
  temperature: z.number().nullable(),
  humidity: z.number().nullable(),
  voltage: z.number().nullable(),
});

export type TelemetryRecord = z.infer<typeof TelemetryRecordSchema>;

export const transformEventToRecord = (event: any): TelemetryRecord => {
  return {
    deviceId: event.deviceId,
    timestamp: event.recordedAt,
    temperature: event.data?.temperature ?? null,
    humidity: event.data?.humidity ?? null,
    voltage: event.data?.voltage ?? null,
  };
};
