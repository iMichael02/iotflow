import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Batcher } from "../src/lib/batcher";

describe("Batcher", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("flushes when the batch size is reached", async () => {
        const flushed: number[][] = [];
        const batcher = new Batcher<number>(async (items) => void flushed.push(items), 3, 10_000);

        await batcher.add(1);
        await batcher.add(2);
        expect(flushed).toEqual([]);

        await batcher.add(3);
        expect(flushed).toEqual([[1, 2, 3]]);
    });

    it("flushes after the interval elapses", async () => {
        const flushed: number[][] = [];
        const batcher = new Batcher<number>(async (items) => void flushed.push(items), 100, 5_000);

        await batcher.add(1);
        await vi.advanceTimersByTimeAsync(5_000);

        expect(flushed).toEqual([[1]]);
    });

    it("does not flush an empty buffer", async () => {
        const flushBatch = vi.fn(async () => {});
        const batcher = new Batcher<number>(flushBatch, 3, 1_000);

        await batcher.flush();

        expect(flushBatch).not.toHaveBeenCalled();
    });

    it("keeps items buffered when a flush fails, and retries them", async () => {
        const flushed: number[][] = [];
        let fail = true;
        const batcher = new Batcher<number>(
            async (items) => {
                if (fail) throw new Error("minio down");
                flushed.push(items);
            },
            2,
            10_000,
        );

        await batcher.add(1);
        await expect(batcher.add(2)).rejects.toThrow("minio down");

        fail = false;
        await batcher.add(3);

        expect(flushed).toEqual([[1, 2, 3]]);
    });
});
