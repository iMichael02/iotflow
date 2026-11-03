import { describe, it, expect } from 'vitest';
import { transformEventToRecord } from '../src/lib/transformer';

describe('Transformer', () => {
  it('should correctly transform a valid event to a record', () => {
    const event = {
      deviceId: 'device-123',
      deviceType: 'sensor',
      recordedAt: 1725350400000,
      receivedAt: 1725350400100,
      data: {
        temperature: 22.5,
        humidity: 45,
        voltage: 3.7,
      },
    };

    const record = transformEventToRecord(event);

    expect(record).toEqual({
      deviceId: 'device-123',
      timestamp: 1725350400000,
      temperature: 22.5,
      humidity: 45,
      voltage: 3.7,
    });
  });

  it('should handle missing data fields by setting them to null', () => {
    const event = {
      deviceId: 'device-123',
      deviceType: 'sensor',
      recordedAt: 1725350400000,
      receivedAt: 1725350400100,
      data: {},
    };

    const record = transformEventToRecord(event);

    expect(record).toEqual({
      deviceId: 'device-123',
      timestamp: 1725350400000,
      temperature: null,
      humidity: null,
      voltage: null,
    });
  });
});
