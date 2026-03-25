import { useEffect, useState, useRef } from "react";
import { Terminal, X } from "lucide-react";
import { motion } from "framer-motion";

interface LogViewerProps {
    deploymentId: string;
    appId: string;
    stageId?: string;
    onClose: () => void;
    token: string;
    isEmbedded?: boolean;
    type?: 'build' | 'deployment';
}

export default function LogViewer({ 
    deploymentId, 
    appId, 
    stageId, 
    onClose, 
    token, 
    isEmbedded = false,
    type = 'deployment'
}: LogViewerProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!deploymentId || !appId || appId === 'undefined' || appId === 'null') return;

        setLogs((prev: string[]) => [...prev, `Connecting to log stream${stageId ? ` for stage ${stageId}` : ''}...`]);

        const controller = new AbortController();
        const fetchLogs = async () => {
            try {
                const basePath = type === 'build' 
                    ? `/api/v1/apps/${appId}/build/${deploymentId}/logs`
                    : `/api/v1/apps/${appId}/deployments/${deploymentId}/logs`;
                
                const url = new URL(basePath, window.location.origin);
                if (stageId) url.searchParams.append('stageId', stageId);

                const response = await fetch(url.toString(), {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(`Failed to connect: ${response.statusText}`);
                }

                setIsConnected(true);
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) {
                    throw new Error("No reader available");
                }

                let buffer = "";

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    // Process complete lines (SSE sends "data: ...\n\n")
                    const lines = buffer.split("\n\n");
                    buffer = lines.pop() || ""; // Keep the last partial chunk

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        
                        const dataMatch = line.match(/^data:\s*(.+)$/m);
                        if (dataMatch) {
                            const data = dataMatch[1].trim();
                            if (data) {
                                setLogs((prev: string[]) => [...prev.slice(-999), data]);
                            }
                        } else if (!line.includes("event: ")) {
                            // Support raw lines if they don't have event/data prefix
                             setLogs((prev: string[]) => [...prev.slice(-999), line.trim()]);
                        }
                    }
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setLogs((prev: string[]) => [...prev, `Error: ${err.message}`]);
                    setIsConnected(false);
                }
            }
        };

        fetchLogs();

        return () => {
            controller.abort();
            setIsConnected(false);
        };
    }, [deploymentId, appId, stageId, token]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const containerClasses = isEmbedded 
        ? "w-full h-full flex flex-col font-mono text-xs bg-[#0B0C10]" 
        : "fixed bottom-4 right-4 w-[500px] h-[350px] bg-[#0D0E12] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden z-50 font-mono text-xs";

    return (
        <motion.div
            initial={isEmbedded ? {} : { opacity: 0, y: 20 }}
            animate={isEmbedded ? {} : { opacity: 1, y: 0 }}
            exit={isEmbedded ? {} : { opacity: 0, y: 20 }}
            className={containerClasses}
        >
            {!isEmbedded && (
                <div className="h-8 bg-[#15171C] border-b border-white/5 flex items-center justify-between px-3">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Terminal className="w-3.5 h-3.5" />
                        <span className="font-medium">Build Logs</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-blue-400">{deploymentId.substring(0, 8)}</span>
                        {isConnected ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-slate-300">
                {logs.length === 0 && <span className="text-slate-600 opacity-50 italic">Waiting for logs...</span>}
                {logs.map((log: string, i: number) => (
                    <div key={i} className="break-all whitespace-pre-wrap font-mono leading-relaxed">
                        <span className="text-slate-600 select-none mr-2">{(i + 1).toString().padStart(3, ' ')}</span>
                        {log}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </motion.div>
    );
}
