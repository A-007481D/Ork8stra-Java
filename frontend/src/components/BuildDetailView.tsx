import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Maximize2, Terminal as TerminalIcon, Layout, ChevronDown, ChevronUp } from 'lucide-react';
import PipelineWorkflow from './PipelineWorkflow';
import LogViewer from './LogViewer';

interface BuildDetailViewProps {
  deploymentId: string;
  appId: string;
  token: string;
  onClose: () => void;
}

const BuildDetailView = ({ deploymentId, appId, token, onClose }: BuildDetailViewProps) => {
  const [deployment, setDeployment] = useState<any>(null);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [logsExpanded, setLogsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'graph' | 'logs'>('split');

  // Fetch initial data & Listen for SSE updates via fetch streaming
  useEffect(() => {
    if (!deploymentId || !appId || appId === 'undefined') return;

    const controller = new AbortController();

    // Initial fetch
    fetch(`/api/v1/apps/${appId}/deployments/${deploymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    })
    .then(r => r.json())
    .then(setDeployment)
    .catch(err => {
        if (err.name !== 'AbortError') console.error("Fetch Deployment Error:", err);
    });

    // Custom SSE via FETCH to support Authorization header
    const streamEvents = async () => {
        try {
            const response = await fetch(`/api/v1/apps/${appId}/deployments/${deploymentId}/events`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });

            if (!response.ok) throw new Error(`Events connection failed: ${response.statusText}`);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) return;

            let buffer = "";
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop() || "";

                for (const part of parts) {
                    if (part.startsWith("event: pipeline-update")) {
                        const dataLine = part.split("\n").find(l => l.startsWith("data: "));
                        if (dataLine) {
                            try {
                                const updatedDeployment = JSON.parse(dataLine.substring(6));
                                setDeployment(updatedDeployment);
                            } catch (e) {
                                console.error("Failed to parse pipeline event:", e);
                            }
                        }
                    }
                }
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') console.error("SSE Stream Error:", err);
        }
    };

    streamEvents();

    return () => controller.abort();
  }, [deploymentId, appId, token]);

  const handleStageClick = useCallback((stageId: string) => {
    setActiveStageId(stageId);
    setLogsExpanded(true);
  }, []);

  if (!deployment) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full h-full max-w-7xl bg-[#0D0E12] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#15171C]/50">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${
              deployment.status === 'HEALTHY' ? 'bg-emerald-500' : 
              deployment.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
            }`} />
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Pipeline Execution <span className="text-slate-500 font-mono text-sm">#{deploymentId.substring(0, 8)}</span>
              </h2>
              <p className="text-xs text-slate-400">Target Image: <span className="font-mono">{deployment.imageTag || 'Pending...'}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 mr-4">
              <button 
                onClick={() => setViewMode('graph')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'graph' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Layout className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('split')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'split' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('logs')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'logs' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <TerminalIcon className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top: DAG Visualization */}
          {(viewMode === 'split' || viewMode === 'graph') && (
            <div className={`relative transition-all duration-500 ease-in-out ${
              viewMode === 'graph' ? 'h-full' : (logsExpanded ? 'h-1/2' : 'h-[calc(100%-40px)]')
            }`}>
              <PipelineWorkflow 
                stages={deployment.stages || []} 
                onNodeClick={handleStageClick}
              />
            </div>
          )}

          {/* Bottom: Embedded Logs */}
          {(viewMode === 'split' || viewMode === 'logs') && (
            <div className={`flex flex-col border-t border-white/5 bg-[#0B0C10] transition-all duration-500 ease-in-out ${
              viewMode === 'logs' ? 'h-full' : (logsExpanded ? 'h-1/2' : 'h-[40px]')
            }`}>
              <div 
                className="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02]"
                onClick={() => setLogsExpanded(!logsExpanded)}
              >
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  <TerminalIcon className="w-4 h-4" />
                  Execution Logs {activeStageId && <span className="text-blue-400 ml-2">— Stage: {activeStageId}</span>}
                </div>
                {logsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </div>
              
              <div className="flex-1 overflow-hidden font-mono text-xs">
                <LogViewer 
                  deploymentId={deploymentId}
                  appId={appId}
                  stageId={activeStageId || undefined} 
                  onClose={() => setViewMode('graph')}
                  token={token}
                  isEmbedded={true}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BuildDetailView;
