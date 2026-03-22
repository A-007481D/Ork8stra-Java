import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  CheckCircle2, XCircle, Clock, Loader2, 
  Hammer, FlaskConical, Rocket, 
  Package, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const getStageTheme = (name: string) => {
  const n = name.toUpperCase();
  if (n.includes('SOURCE') || n.includes('BUILD') || n.includes('COMPILE')) {
    return {
      icon: Hammer,
      color: '#F59E0B', 
      accent: 'text-amber-400',
      bg: 'bg-amber-500/5',
      fill: 'rgba(245, 158, 11, 0.15)',
      border: 'border-amber-500/30',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]'
    };
  }
  if (n.includes('QUALITY') || n.includes('TEST') || n.includes('LINT')) {
    return {
      icon: FlaskConical,
      color: '#3B82F6', 
      accent: 'text-blue-400',
      bg: 'bg-blue-500/5',
      fill: 'rgba(59, 130, 246, 0.15)',
      border: 'border-blue-500/30',
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]'
    };
  }
  if (n.includes('PUB') || n.includes('PUSH') || n.includes('IMAGE') || n.includes('PACKAGE')) {
    return {
      icon: Package,
      color: '#A855F7', 
      accent: 'text-purple-400',
      bg: 'bg-purple-500/5',
      fill: 'rgba(168, 85, 247, 0.15)',
      border: 'border-purple-500/30',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.1)]'
    };
  }
  if (n.includes('ROLLOUT') || n.includes('DEPLOY') || n.includes('PROD')) {
    return {
      icon: Rocket,
      color: '#10B981', 
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/5',
      fill: 'rgba(16, 185, 129, 0.15)',
      border: 'border-emerald-500/30',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]'
    };
  }
  return {
    icon: Activity,
    color: '#94A3B8', 
    accent: 'text-slate-400',
    bg: 'bg-slate-500/5',
    fill: 'rgba(148, 163, 184, 0.15)',
    border: 'border-slate-500/30',
    glow: 'shadow-[0_0_15px_rgba(148,163,184,0.1)]'
  };
};

const StageNode = ({ data }: any) => {
  const { name, status, duration, estimatedDuration = 60, startTime, isLast, isFirst } = data;
  const theme = getStageTheme(name);
  const StageIcon = theme.icon;
  
  const [progress, setProgress] = useState(0);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === 'SUCCESS') {
      setProgress(100);
      return;
    }
    if (status === 'FAILED') {
      return;
    }
    if (status === 'RUNNING' && startTime) {
      const startTimestamp = new Date(startTime).getTime();
      const durationMs = estimatedDuration * 1000;

      const updateProgress = () => {
        const now = Date.now();
        const elapsed = now - startTimestamp;
        const currentProgress = Math.min((elapsed / durationMs) * 100, 99.5);
        setProgress(currentProgress);
        requestRef.current = requestAnimationFrame(updateProgress);
      };

      requestRef.current = requestAnimationFrame(updateProgress);
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
    }
    setProgress(0);
  }, [status, startTime, estimatedDuration]);

  const getStatusIcon = () => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'RUNNING':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-4 h-4 text-white" />
          </motion.div>
        );
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const statusBorderClass = status === 'RUNNING' ? 'border-white/40' : (status === 'SUCCESS' ? 'border-emerald-500/50' : theme.border);
  
  const backgroundStyle = {
    '--progress': `${progress}%`,
    '--fill-color': status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : theme.fill,
  } as React.CSSProperties;

  return (
    <div 
      className={`px-5 py-4 rounded-2xl border backdrop-blur-xl min-w-[220px] transition-all duration-500 group relative overflow-hidden ${theme.bg} ${statusBorderClass} ${theme.glow}`}
      style={backgroundStyle}
    >
      {/* Liquid Fill Element */}
      <motion.div 
         initial={false}
         animate={{ width: `${progress}%` }}
         transition={{ type: "spring", stiffness: 50, damping: 20 }}
         className="absolute top-0 left-0 bottom-0 z-0 overflow-hidden transition-colors duration-500"
         style={{ backgroundColor: 'var(--fill-color)' }}
      >
        {status === 'RUNNING' && <div className="liquid-wave" />}
      </motion.div>

      {/* Leading Edge Glow */}
      {status === 'RUNNING' && (
        <motion.div 
           animate={{ left: `${progress}%` }}
           transition={{ type: "spring", stiffness: 50, damping: 20 }}
           className="absolute top-0 bottom-0 w-[4px] z-10 blur-[4px]"
           style={{ backgroundColor: theme.color, opacity: 0.5 }}
        />
      )}

      {!isFirst && <Handle type="target" position={Position.Left} className="!bg-slate-700 !w-2 !h-2 !border-none !z-20" />}
      
      <div className="flex flex-col gap-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg bg-black/40 border border-white/5 ${theme.accent}`}>
             <StageIcon className="w-5 h-5" />
          </div>
          <div className="bg-black/40 px-2 py-1 rounded-md border border-white/5">
             {getStatusIcon()}
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-xs font-black text-white truncate uppercase tracking-[0.15em] mb-1">{name}</span>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold tracking-widest ${status === 'RUNNING' ? 'text-white' : 'text-slate-500'}`}>
              {status}
            </span>
            {(duration || progress > 0) && (
              <span className="text-[10px] text-slate-500 font-mono italic">
                {status === 'RUNNING' ? `${Math.round(progress)}%` : duration}
              </span>
            )}
          </div>
        </div>
      </div>

      {status === 'RUNNING' && (
        <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
          <motion.div 
            className="h-full"
            style={{ backgroundColor: theme.color, width: `${progress}%` }}
          />
        </div>
      )}

      {!isLast && <Handle type="source" position={Position.Right} className="!bg-slate-700 !w-2 !h-2 !border-none !z-20" />}
    </div>
  );
};

export default memo(StageNode);
