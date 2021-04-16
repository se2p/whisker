import {GraphNode, Graph} from '../src/graph-utils';
import {computePostDominatedTree, PostDominatorTree} from '../src/post-dominator-tree';
import {ControlDependenceGraph, generateCDG} from '../src/control-dependence-graph';

const SumsExample = {
    cfg: () => {
        const entry = new GraphNode('entry');
        const exit = new GraphNode('exit');
        const graph = new Graph(entry, exit);
        graph.addNode(entry);
        graph.addNode(exit);
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .map(num => new GraphNode(num))
            .forEach(node => {
                graph.addNode(node);
            });
        [
            ['entry', 1],
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 5],
            [4, 12],
            [5, 6],
            [6, 7],
            [7, 8],
            [7, 10],
            [8, 9],
            [9, 7],
            [10, 11],
            [11, 4],
            [12, 'exit']
        ].forEach(arr => {
            const from = graph.getNode(arr[0]);
            const to = graph.getNode(arr[1]);
            graph.addEdge(from, to);
        });
        return graph;
    },
    pdt: () => {
        const exit = new GraphNode('exit');
        const graph = new Graph(exit);
        graph.addNode(exit);
        ['start', 'entry', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .map(num => new GraphNode(num))
            .forEach(node => {
                graph.addNode(node);
            });
        [
            ['exit', 'start'],
            ['exit', 12],
            [12, 4],
            [4, 3],
            [4, 11],
            [3, 2],
            [2, 1],
            [1, 'entry'],
            [11, 10],
            [10, 7],
            [7, 6],
            [7, 9],
            [9, 8],
            [6, 5]
        ].forEach(arr => {
            const from = graph.getNode(arr[0]);
            const to = graph.getNode(arr[1]);
            graph.addEdge(from, to);
        });
        return graph;
    },
    cdg: () => {
        const start = new GraphNode('start');
        const graph = new Graph(start);
        graph.addNode(start);
        ['exit', 'entry', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .map(num => new GraphNode(num))
            .forEach(node => {
                graph.addNode(node);
            });
        [
            ['start', ['entry', 1, 2, 3, 4, 12]],
            [4, [4, 5, 6, 7, 10, 11]],
            [7, [7, 8, 9]]
        ].forEach(arr => {
            const from = graph.getNode(arr[0]);
            for (const a of arr[1]) {
                const to = graph.getNode(a);
                graph.addEdge(from, to);
            }
        });
        return graph;
    }

};

const BASICExample = {
    cfg: () => {
        const entry = new GraphNode('entry');
        const exit = new GraphNode('exit');
        const graph = new Graph(entry, exit);
        graph.addNode(entry);
        graph.addNode(exit);
        [1, 2, 3, 5, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 300]
            .map(num => new GraphNode(num))
            .forEach(node => {
                graph.addNode(node);
            });
        [
            ['entry', 1],
            [1, 2],
            [2, 3],
            [3, 5],
            [5, 100],
            [100, 110],
            [110, 120],
            [120, 130],
            [130, 140],
            [140, 150],
            [150, 160],
            [160, 170],
            [170, 180],
            [180, 190],
            [190, 140],
            [160, 190],
            [140, 200],
            [200, 210],
            [210, 110],
            [110, 300],
            [300, 'exit']
        ].forEach(arr => {
            const from = graph.getNode(arr[0]);
            const to = graph.getNode(arr[1]);
            graph.addEdge(from, to);
        });
        return graph;
    },
    pdt: () => {
        const exit = new GraphNode('exit');
        const graph = new Graph(exit);
        graph.addNode(exit);
        ['start', 'entry', 1, 2, 3, 5, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 300]
            .map(num => new GraphNode(num))
            .forEach(node => {
                graph.addNode(node);
            });
        [
            ['exit', 'start'],
            ['exit', 300],
            [300, 110],
            [110, 210],
            [210, 200],
            [200, 140],
            [140, 190],
            [190, 180],
            [180, 170],
            [190, 160],
            [160, 150],
            [140, 130],
            [130, 120],
            [110, 100],
            [100, 5],
            [5, 3],
            [3, 2],
            [2, 1],
            [1, 'entry']
        ].forEach(arr => {
            const from = graph.getNode(arr[0]);
            const to = graph.getNode(arr[1]);
            graph.addEdge(from, to);
        });
        return graph;
    },
    cdg: () => {
        const start = new GraphNode('start');
        const graph = new Graph(start);
        graph.addNode(start);
        ['exit', 'entry', 1, 2, 3, 5, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 300]
            .map(num => new GraphNode(num))
            .forEach(node => {
                graph.addNode(node);
            });
        [
            ['start', [1, 2, 3, 5, 100, 110, 300, 'entry']],
            [110, [110, 210, 200, 120, 130, 140]],
            [140, [140, 150, 160, 190]],
            [160, [170, 180]]
        ].forEach(arr => {
            const from = graph.getNode(arr[0]);
            for (const a of arr[1]) {
                const to = graph.getNode(a);
                graph.addEdge(from, to);
            }
        });
        return graph;
    }
};

test('Sums Example: Post dominator tree', () => {
    const expected = SumsExample.pdt();
    const actual = computePostDominatedTree(SumsExample.cfg());

    expect(actual).toBeInstanceOf(PostDominatorTree);
    expect(actual).toEqual(expected);
});

test('Sums Example: Control dependence graph', () => {
    const expected = SumsExample.cdg();
    const actual = generateCDG(SumsExample.cfg());

    expect(actual).toBeInstanceOf(ControlDependenceGraph);
    expect(actual).toEqual(expected);
});

test('BASIC Example: Post dominator tree', () => {
    const expected = BASICExample.pdt();
    const actual = computePostDominatedTree(BASICExample.cfg());

    expect(actual).toBeInstanceOf(PostDominatorTree);
    expect(actual).toEqual(expected);
});

test('BASIC Example: Control dependence graph', () => {
    const expected = BASICExample.cdg();
    const actual = generateCDG(BASICExample.cfg());

    expect(actual).toBeInstanceOf(ControlDependenceGraph);
    expect(actual).toEqual(expected);
});
