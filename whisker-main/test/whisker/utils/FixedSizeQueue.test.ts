import {expect} from "@jest/globals";
import {FixedSizeQueue} from "../../../src/whisker/utils/FixedSizeQueue";

describe("FixedSizeQueue", () => {

    let queue: FixedSizeQueue<number>;

    beforeEach(() => {
        queue = new FixedSizeQueue(10);
    });

    test("Test enqueue", () => {
       queue.enqueue(1);
       queue.enqueue(2);
       queue.enqueue(3);
       expect(queue.toArray()).toEqual([1, 2, 3]);
    });

    test ("Test repeated enqueue calls are equivalent to enqueueMany", () => {
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);

        const queue2 = new FixedSizeQueue<number>(10);
        queue2.enqueueMany([1,2,3]);
        expect(queue2.toArray()).toEqual(queue.toArray());
    });

    test ("Test enqueue to full queue", () => {
        queue.enqueueMany([1,2,3,4,5,6,7,8,9,10]);
        expect(queue.size()).toBe(10);
        expect(queue.toArray()).toEqual([1,2,3,4,5,6,7,8,9,10]);

        queue.enqueue(11);
        expect(queue.size()).toBe(10);
        expect(queue.toArray()).toEqual([2,3,4,5,6,7,8,9,10,11]);
    });

    test("Test dequeue", () => {
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);
        expect(queue.dequeue()).toBe(1);
        expect(queue.toArray()).toEqual([2, 3]);
    });

    test("Test dequeue on empty queue", () => {
        expect(queue.dequeue()).toBeNull();
    });

    test("Test peek", () => {
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);
        expect(queue.peek()).toBe(1);
        expect(queue.toArray()).toEqual([1, 2, 3]);
    });

    test ("Test peek on empty queue", () => {
        expect(queue.peek()).toBeNull();
    });

    test ("Test isEmpty", () => {
        expect(queue.isEmpty()).toBeTruthy();
        queue.enqueue(1);
        expect(queue.isEmpty()).toBeFalsy();
        queue.dequeue();
        expect(queue.isEmpty()).toBeTruthy();
    });

    test("Test clear", () => {
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);
        queue.clear();
        expect(queue.isEmpty()).toBeTruthy();
    });

    test("Test Sample", () => {
        queue.enqueueMany([1,2,3,4,5,6,7,8,9,10]);
        const sample = queue.sample(3);
        expect(sample.length).toBe(3);
    });
});
