import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  CheckCircle2, XCircle, Clock, Loader2, 
  Terminal, Shield, Send, 
  Package, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const getStageTheme = (name: string) => {
  const n = name.toUpperCase();
  if (n.includes('SOURCE') || n.includes('BUILD') || n.includes('COMPILE')) {
    return {
      icon: Terminal,
      color: '#F59E0B', 
      accent: 'text-amber-400/80',
      bg: 'bg-amber-500/5',
      fill: 'rgba(245, 158, 11, 0.12)',
      border: 'border-amber-500/20',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.05)]'
    };
  }
  if (n.includes('QUALITY') || n.includes('TEST') || n.includes('LINT')) {
    return {
      icon: Shield,
      color: '#3B82F6', 
      accent: 'text-blue-400/80',
      bg: 'bg-blue-500/5',
      fill: 'rgba(59, 130, 246, 0.12)',
      border: 'border-blue-500/20',
      glow: 'shadow-[0_0_10px_rgba(59,130,246,0.05)]'
    };
  }
  if (n.includes('PUB') || n.includes('PUSH') || n.includes('IMAGE') || n.includes('PACKAGE')) {
    return {
      icon: Package,
      color: '#A855F7', 
      accent: 'text-purple-400/80',
      bg: 'bg-purple-500/5',
      fill: 'rgba(168, 85, 247, 0.12)',
      border: 'border-purple-500/20',
      glow: 'shadow-[0_0_10px_rgba(168,85,247,0.05)]'
    };
  }
  if (n.includes('ROLLOUT') || n.includes('DEPLOY') || n.includes('PROD')) {
    return {
      icon: Send,
      color: '#10B981', 
      accent: 'text-emerald-400/80',
      bg: 'bg-emerald-500/5',
      fill: 'rgba(16, 185, 129, 0.12)',
      border: 'border-emerald-500/20',
      glow: 'shadow-[0_0_10px_rgba(16,185,129,0.05)]'
    };
  }
  return {
    icon: Activity,
    color: '#94A3B8', 
    accent: 'text-slate-400/80',
    bg: 'bg-slate-500/5',
    fill: 'rgba(148, 163, 184, 0.12)',
    border: 'border-slate-500/20',
    glow: 'shadow-[0_0_10px_rgba(148,163,184,0.05)]'
  };
};

const StageNode = ({ data }: any) => {
  const { name, status, duration, estimatedDuration = 60, startTime, isLast, isFirst } = data;
  const theme = getStageTheme(name);
  const StageIcon = theme.icon;
  
  const [progress, setProgress] = useState(0);
  const [liveDuration, setLiveDuration] = useState(0);
  const nodeRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Calculate current progress based on startTime
  const start = startTime ? new Date(startTime).getTime() : Date.now();
  const initialProgress = Math.min(Math.max((Date.now() - start) / (estimatedDuration * 1000), 0), 1);

  useEffect(() => {
    if (status === 'RUNNING') {
      const delay = setTimeout(() => {
        setIsActive(true);
      }, 50); 
      
      const interval = setInterval(() => {
        if (startTime) {
          const st = new Date(startTime).getTime();
          setLiveDuration(Math.floor((Date.now() - st) / 1000));
        }
      }, 1000);

      return () => {
        clearTimeout(delay);
        clearInterval(interval);
      };
    } else {
      setIsActive(false);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      // Immediate update for completed/pending states
      const finalP = status === 'SUCCESS' ? 100 : (status === 'FAILED' ? (initialProgress * 100) : 0);
      setProgress(finalP);
      setLiveDuration(0);
    }
  }, [status, startTime, initialProgress]);

  useEffect(() => {
    if (!isActive || !startTime) return;

    const animate = () => {
      const now = Date.now();
      const st = new Date(startTime).getTime();
      const elapsed = now - st;
      const newProgress = Math.min((elapsed / (estimatedDuration * 1000)) * 100, 100);

      setProgress(newProgress);

      if (newProgress < 100) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, startTime, estimatedDuration]);

  const getStatusIcon = () => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'FAILED':
        return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'RUNNING':
      case 'IN_PROGRESS':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-3.5 h-3.5 text-white" />
          </motion.div>
        );
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const statusBorderClass = (status === 'RUNNING' || status === 'IN_PROGRESS') ? 'border-white/30' : (status === 'SUCCESS' || status === 'HEALTHY' ? 'border-emerald-500/30' : theme.border);
  
  const backgroundStyle = {
    '--progress': `${progress}%`,
    '--fill-color': (status === 'SUCCESS' || status === 'HEALTHY') ? 'rgba(16, 185, 129, 0.08)' : theme.fill,
  } as React.CSSProperties;

  return (
    <div 
      ref={nodeRef}
      className={`px-4 py-3 rounded-xl border backdrop-blur-xl min-w-[190px] transition-all duration-500 group relative overflow-hidden ${theme.bg} ${statusBorderClass} ${theme.glow}`}
      style={backgroundStyle}
    >
      {/* Liquid Fill Element */}
      <div 
         className="absolute top-0 left-0 bottom-0 z-0 overflow-hidden transition-all duration-800"
         style={{ 
            backgroundColor: 'var(--fill-color)', 
            width: 'var(--progress)',
            boxShadow: 'inset -20px 0 30px -15px rgba(255,255,255,0.05)'
         }}
      >
        {status === 'RUNNING' && <div className="liquid-wave" />}
      </div>

      {!isFirst && <Handle type="target" position={Position.Left} className="!bg-slate-700 !w-1.5 !h-1.5 !border-none !z-20" />}
      
      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${theme.accent}`}>
             <StageIcon className="w-4 h-4" />
             <span className="text-xs font-semibold text-white/90 truncate max-w-[120px]">{name}</span>
          </div>
          <div className="bg-black/30 p-1 rounded border border-white/5 leading-none">
             {getStatusIcon()}
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-bold tracking-wider ${status === 'RUNNING' ? 'text-white' : 'text-slate-500/80'}`}>
              {status}
            </span>
            {(duration || progress > 0 || liveDuration > 0) && (
              <span className="text-[9px] text-slate-500/80 font-mono">
                {status === 'RUNNING' ? `${liveDuration}s` : duration}
              </span>
            )}
          </div>
        </div>
      </div>

      {(status === 'RUNNING' || status === 'IN_PROGRESS') && (
        <div className="absolute -bottom-[1px] left-0 right-0 h-[1.5px] bg-white/5 overflow-hidden">
          <div 
            className="h-full transition-all duration-300"
            style={{ backgroundColor: theme.color, width: 'var(--progress)' }}
          />
        </div>
      )}

      {!isLast && <Handle type="source" position={Position.Right} className="!bg-slate-700 !w-1.5 !h-1.5 !border-none !z-20" />}
    </div>
  );
};

export default memo(StageNode);
