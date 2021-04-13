import {cloneGraph, Graph, GraphNode, reverseGraph} from '../src/graph-utils';

const cfg = () => {
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
};


test('Graph cloning', () => {
    const expected = cfg();
    const actual = cloneGraph(expected);

    expect(actual).toStrictEqual(expected);
});

test('Graph reversing', () =>{
    const expected = cfg();
    const actual = reverseGraph(reverseGraph(expected));
    expect(actual).toStrictEqual(expected);
});
