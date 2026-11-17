/**
 * Accumulates items and flushes them as a batch when `maxSize` is reached or
 * `flushIntervalMs` has elapsed since the first buffered item.
 * Flushes are serialized; a failed flush keeps its items buffered for the next attempt.
 */
export class Batcher<T> {
    private buffer: T[] = [];
    private timer?: NodeJS.Timeout;
    /** Tail of the flush queue; never rejects, so one failed flush does not poison later ones. */
    private queue: Promise<unknown> = Promise.resolve();

    constructor(
        private readonly flushBatch: (items: T[]) => Promise<void>,
        private readonly maxSize: number,
        private readonly flushIntervalMs: number,
    ) {}

    async add(item: T): Promise<void> {
        this.buffer.push(item);

        if (this.buffer.length >= this.maxSize) {
            await this.flush();
            return;
        }

        this.timer ??= setTimeout(() => {
            this.flush().catch((error) => console.error("[stream-processor] Timed flush failed", error));
        }, this.flushIntervalMs);
    }

    flush(): Promise<void> {
        const result = this.queue.then(() => this.drain());
        this.queue = result.catch(() => undefined);
        return result;
    }

    private async drain() {
        clearTimeout(this.timer);
        this.timer = undefined;

        if (this.buffer.length === 0) {
            return;
        }

        const items = this.buffer;
        this.buffer = [];

        try {
            await this.flushBatch(items);
        } catch (error) {
            this.buffer = [...items, ...this.buffer];
            throw error;
        }
    }
}
