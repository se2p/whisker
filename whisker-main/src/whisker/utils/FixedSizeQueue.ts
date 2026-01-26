import Arrays from "./Arrays";

/**
 * A queue implementation that has a fixed size.
 * If the queue is full upon adding new entries, the oldest items are removed.
 */
export class FixedSizeQueue<T> {
    private items: T[] = [];

    constructor(private readonly maxSize: number) {
    }

    enqueue(item: T): void {
        if (this.items.length >= this.maxSize) {
            this.dequeue();
        }
        this.items.push(item);
    }

    enqueueMany(items: T[]): void {
        for (const item of items) {
            this.enqueue(item);
        }
    }

    dequeue(): T | null {
        return this.size() > 0 ? this.items.shift() : null;
    }

    peek(): T | null {
        return this.size() > 0 ? this.items[0] : null;
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    size(): number {
        return this.items.length;
    }

    clear(): void {
        this.items = [];
    }

    toArray(): T[] {
        return [...this.items];
    }

    sample(numberOfSamples: number): T[] {
        const elements = this.toArray();
        Arrays.shuffle(elements);
        return elements.slice(0, numberOfSamples);
    }
}
