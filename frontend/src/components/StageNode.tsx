import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  CheckCircle2, XCircle, Clock, Loader2, 
  Hammer, FlaskConical, Rocket, ShieldCheck, 
  Package, LayoutGrid, Cpu, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const getStageTheme = (name: string) => {
  const n = name.toUpperCase();
  if (n.includes('BUILD') || n.includes('COMPILE')) {
    return {
      icon: Hammer,
      color: 'amber',
      accent: 'text-amber-400',
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/30',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]'
    };
  }
  if (n.includes('TEST') || n.includes('LINT') || n.includes('SCAN')) {
    return {
      icon: FlaskConical,
      color: 'blue',
      accent: 'text-blue-400',
      bg: 'bg-blue-500/5',
      border: 'border-blue-500/30',
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]'
    };
  }
  if (n.includes('PUB') || n.includes('PUSH') || n.includes('IMAGE')) {
    return {
      icon: Package,
      color: 'purple',
      accent: 'text-purple-400',
      bg: 'bg-purple-500/5',
      border: 'border-purple-500/30',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.1)]'
    };
  }
  if (n.includes('DEPLOY') || n.includes('PROD') || n.includes('ENV')) {
    return {
      icon: Rocket,
      color: 'emerald',
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/30',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]'
    };
  }
  return {
    icon: Activity,
    color: 'slate',
    accent: 'text-slate-400',
    bg: 'bg-slate-500/5',
    border: 'border-slate-500/30',
    glow: 'shadow-[0_0_15px_rgba(148,163,184,0.1)]'
  };
};

const StageNode = ({ data }: any) => {
  const { name, status, duration, isLast, isFirst } = data;
  const theme = getStageTheme(name);
  const StageIcon = theme.icon;

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

  const statusBorderClass = status === 'RUNNING' ? 'border-white/50' : theme.border;

  return (
    <div className={`px-5 py-4 rounded-2xl border backdrop-blur-xl min-w-[200px] transition-all duration-500 group ${theme.bg} ${statusBorderClass} ${theme.glow}`}>
      {!isFirst && <Handle type="target" position={Position.Left} className="!bg-slate-700 !w-2 !h-2 !border-none" />}
      
      <div className="flex flex-col gap-3">
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
            {duration && (
              <span className="text-[10px] text-slate-500 font-mono italic">{duration}</span>
            )}
          </div>
        </div>
      </div>

      {status === 'RUNNING' && (
        <motion.div 
          className="absolute -bottom-[1px] left-2 right-2 h-[2px] bg-white rounded-full overflow-hidden shadow-[0_0_10px_rgba(255,255,255,0.5)]"
        >
          <motion.div 
            className="h-full bg-blue-400"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      )}

      {!isLast && <Handle type="source" position={Position.Right} className="!bg-slate-700 !w-2 !h-2 !border-none" />}
    </div>
  );
};

export default memo(StageNode);
