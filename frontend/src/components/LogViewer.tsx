"use client";

import { useEffect, useState, useRef } from "react";
import { Terminal, X } from "lucide-react";
import { motion } from "framer-motion";

interface LogViewerProps {
    deploymentId: string;
    onClose: () => void;
    token: string;
}

export default function LogViewer({ deploymentId, onClose, token }: LogViewerProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!deploymentId) return;

        setLogs([`Connecting to log stream for deployment ${deploymentId.substring(0, 8)}...`]);

        // Use EventSourcePolyfill if headers are needed, but for now try native EventSource
        // Since EventSource doesn't support headers natively in browser, we might need a workaround or query param
        // Backend `AuthMiddleware` expects Header, but maybe we can allow query param for logs?
        // Let's check backend... `AuthMiddleware` strictly checks Header.
        // NATIVE EventSource CANNOT send custom headers.

        // OPTION 1: Use fetch/reader for streaming (better for headers)
        // OPTION 2: Pass token in URL (less secure but works with EventSource) -> Backend doesn't support query param for auth.
        // I will use fetch with streaming reader to support headers.

        const controller = new AbortController();
        const fetchLogs = async () => {
            try {
                const response = await fetch(`/api/v1/deployments/${deploymentId}/logs`, {
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
                        if (line.startsWith("data: ")) {
                            const data = line.substring(6);
                            setLogs(prev => [...prev.slice(-999), data]); // Keep last 1000 lines
                        } else if (line.startsWith(": ")) {
                            // Comment/keepalive
                            console.log("Keepalive:", line);
                        }
                    }
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setLogs(prev => [...prev, `Error: ${err.message}`]);
                    setIsConnected(false);
                }
            }
        };

        fetchLogs();

        return () => controller.abort();
    }, [deploymentId, token]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 w-[500px] h-[350px] bg-[#0D0E12] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden z-50 font-mono text-xs"
        >
            {/* Header */}
            <div className="h-8 bg-[#15171C] border-b border-white/5 flex items-center justify-between px-3">
                <div className="flex items-center gap-2 text-slate-400">
                    <Terminal className="w-3.5 h-3.5" />
                    <span className="font-medium">Build Logs</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-blue-400">{deploymentId.substring(0, 8)}</span>
                    {isConnected ? (
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        </div>
                    ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onClose} className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-slate-300 bg-[#0B0C10]">
                {logs.length === 0 && <span className="text-slate-600 opacity-50 italic">Waiting for logs...</span>}
                {logs.map((log, i) => (
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
