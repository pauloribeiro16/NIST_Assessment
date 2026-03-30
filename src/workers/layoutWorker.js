import dagre from 'dagre';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

self.onmessage = (event) => {
    const { nodes, edges, direction = 'LR' } = event.data;
    const isHorizontal = direction === 'LR';
    
    dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 200 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 250, height: 100 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? 'left' : 'top';
        node.sourcePosition = isHorizontal ? 'right' : 'bottom';
        node.position = {
            x: nodeWithPosition.x - 125,
            y: nodeWithPosition.y - 50,
        };
    });

    self.postMessage({ nodes, edges });
};
