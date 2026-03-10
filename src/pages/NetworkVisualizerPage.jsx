import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    Handle,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { useAssessment } from '../context/AssessmentContext';
import { ShieldCheck, Crosshair, Fingerprint, Activity, Siren, ActivitySquare, ServerCrash } from 'lucide-react';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 200 });

    nodes.forEach((node) => {
        // Approximate wrapper size
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
        return node;
    });

    return { nodes, edges };
};

// Custom Node for distinct visual style
const CustomNode = ({ data }) => {
    const Icon = data.icon || Activity;
    return (
        <div
            className="w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-[3px] p-4 flex items-center gap-3 transition-transform hover:scale-105 cursor-pointer backdrop-blur-md"
            style={{
                borderColor: data.color + '80', // semi-transparent rim
                boxShadow: `0 4px 15px ${data.color}20`
            }}
        >
            <Handle type="target" position={Position.Left} style={{ background: '#555' }} />

            <div
                className="w-12 h-12 rounded-full flex justify-center items-center flex-shrink-0"
                style={{ backgroundColor: data.color + '20' }}
            >
                <Icon className="w-6 h-6" style={{ color: data.color }} />
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-70" style={{ color: data.color }}>
                    {data.type}
                </span>
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                    {data.label}
                </span>
            </div>
            <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

export default function NetworkVisualizerPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { assessmentData } = useAssessment();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Icon mapping dictionary
    const functionIcons = {
        'Govern': Crosshair,
        'Identify': Fingerprint,
        'Protect': ShieldCheck,
        'Detect': ActivitySquare,
        'Respond': Siren,
        'Recover': ServerCrash
    };

    useEffect(() => {
        if (!assessmentData || !assessmentData.functions) return;

        const initialNodes = [];
        const initialEdges = [];

        // Core Node
        const coreId = 'core-nist';
        initialNodes.push({
            id: coreId,
            type: 'custom',
            data: {
                label: 'NIST CSF 2.0',
                type: 'Framework Overview',
                color: '#4f46e5',
                route: null
            },
            position: { x: 0, y: 0 }
        });

        // Loop over functions and categories to build the raw nodes/edges
        Object.keys(assessmentData.functions).forEach((funcName) => {
            const funcId = `func-${funcName}`;
            const funcColor = assessmentData.nistColors?.[funcName] || '#3b82f6';
            const funcUrl = `/project/${projectId}/function/${funcName.toLowerCase()}`;

            // Add Function Node
            initialNodes.push({
                id: funcId,
                type: 'custom',
                data: {
                    label: funcName,
                    type: 'Core Function',
                    color: funcColor,
                    route: funcUrl,
                    icon: functionIcons[funcName] || Activity
                },
                position: { x: 0, y: 0 }
            });

            // Connect Core -> Function
            initialEdges.push({
                id: `edge-${coreId}-${funcId}`,
                source: coreId,
                target: funcId,
                type: 'smoothstep',
                animated: true,
                style: { stroke: funcColor, strokeWidth: 2 }
            });

            // Loop and add Categories
            const categories = assessmentData.functions[funcName].categories;
            if (categories) {
                Object.keys(categories).forEach((catName) => {
                    const cleanCatId = catName.toLowerCase().replace(/\s+/g, '-');
                    const catId = `cat-${funcName}-${cleanCatId}`;
                    const catUrl = `/project/${projectId}/category/${funcName.toLowerCase()}/${cleanCatId}`;

                    initialNodes.push({
                        id: catId,
                        type: 'custom',
                        data: {
                            label: catName,
                            type: 'Category',
                            color: funcColor,
                            route: catUrl
                        },
                        position: { x: 0, y: 0 }
                    });

                    // Connect Function -> Category
                    initialEdges.push({
                        id: `edge-${funcId}-${catId}`,
                        source: funcId,
                        target: catId,
                        type: 'default',
                        markerEnd: { type: MarkerType.ArrowClosed, color: funcColor + '80' },
                        style: { stroke: funcColor + '80', strokeWidth: 1.5, strokeDasharray: '4 4' }
                    });
                });
            }
        });

        // Auto Layout with Dagre
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges,
            'LR'
        );

        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
    }, [assessmentData, projectId, setNodes, setEdges]); // eslint-disable-line react-hooks/exhaustive-deps

    const onNodeClick = useCallback((event, node) => {
        if (node.data && node.data.route) {
            navigate(node.data.route);
        }
    }, [navigate]);

    return (
        <div className="h-full w-full flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Network Relationship Graph
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Interactive visualization mapping the NIST CSF 2.0 Core Functions to individual assessment Categories.
                    Click any node to navigate to its detailed scoring page.
                </p>
            </header>

            <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-inner overflow-hidden relative interactive-ring">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    fitView
                    attributionPosition="bottom-right"
                    minZoom={0.1}
                >
                    <Controls className="bg-white dark:bg-gray-800 shadow-xl border-gray-200 dark:border-gray-700" />
                    <Background color="#9ca3af" gap={16} />
                </ReactFlow>
            </div>
        </div>
    );
}
