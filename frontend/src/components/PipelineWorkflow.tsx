import { useMemo, useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  ConnectionLineType,
  MarkerType,
  useNodesState,
  useEdgesState,
  type Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import StageNode from './StageNode';

interface PipelineWorkflowProps {
  stages: any[];
  onNodeClick?: (stageId: string) => void;
}

const PipelineWorkflow = ({ stages, onNodeClick }: PipelineWorkflowProps) => {
  const nodeTypesMemo = useMemo(() => ({ stage: StageNode }), []);
  const edgeTypesMemo = useMemo(() => ({}), []);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const initialElements = useMemo(() => {
    const newNodes: any[] = [];
    const newEdges: Edge[] = [];

    stages.forEach((stage, index) => {
      const isFirst = index === 0;
      const isLast = index === stages.length - 1;
      
      // Calculate duration string
      let duration = "";
      if (stage.startTime) {
        const start = new Date(stage.startTime).getTime();
        const end = stage.endTime ? new Date(stage.endTime).getTime() : Date.now();
        const diff = Math.floor((end - start) / 1000);
        duration = diff > 0 ? `${diff}s` : "0s";
      }

      newNodes.push({
        id: stage.id?.toString() || stage.name,
        type: 'stage',
        data: { 
          name: stage.name, 
          status: stage.status, 
          duration,
          startTime: stage.startTime,
          endTime: stage.endTime,
          estimatedDuration: stage.estimatedDuration,
          isFirst,
          isLast
        },
        position: { x: index * 250, y: 50 },
      });

      if (index > 0) {
        const prevStage = stages[index - 1];
        const isActive = (stage.status === 'RUNNING' || stage.status === 'IN_PROGRESS') || ((prevStage.status === 'SUCCESS' || prevStage.status === 'HEALTHY') && stage.status === 'PENDING');
        
        newEdges.push({
          id: `e-${index-1}-${index}`,
          source: prevStage.id?.toString() || prevStage.name,
          target: stage.id?.toString() || stage.name,
          type: ConnectionLineType.Bezier,
          animated: isActive,
          style: { 
            stroke: isActive ? '#F59E0B' : (stage.status === 'SUCCESS' ? '#10B981' : '#334155'),
            strokeWidth: 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: isActive ? '#F59E0B' : (stage.status === 'SUCCESS' ? '#10B981' : '#334155'),
          },
        });
      }
    });

    return { nodes: newNodes, edges: newEdges };
  }, [stages]);

  useEffect(() => {
    setNodes(initialElements.nodes);
    setEdges(initialElements.edges);
  }, [initialElements, setNodes, setEdges]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  }, [onNodeClick]);

  return (
    <div className="w-full h-full min-h-[300px] bg-[#0D0E12]/50 rounded-2xl border border-white/5 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypesMemo}
        edgeTypes={edgeTypesMemo}
        fitView
        selectNodesOnDrag={false}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll={false}
        panOnDrag={true}
      >
        <Background color="#1E293B" gap={20} size={1} />
        <Controls 
          className="!bg-[#15171C] !border-white/20 !fill-white !shadow-2xl" 
          showInteractive={false}
          style={{ 
            backgroundColor: '#15171C', 
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        />
      </ReactFlow>

      {/* Marching Ants & Liquid Wave CSS Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        .react-flow__edge-path {
          transition: stroke 0.5s ease;
        }
        .react-flow__edge.animated path {
          stroke-dasharray: 8;
          animation: dashdraw 0.5s linear infinite;
        }
        @keyframes dashdraw {
          from { stroke-dashoffset: 16; }
          to { stroke-dashoffset: 0; }
        }

        .liquid-wave {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 20px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent);
          transform: skewX(-20deg);
          animation: wave-shimmer 2s infinite linear;
        }

        @keyframes wave-shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateX(500%) skewX(-20deg); opacity: 0; }
        }
      `}} />
    </div>
  );
};

export default PipelineWorkflow;
