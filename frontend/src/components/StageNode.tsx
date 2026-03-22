import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const StageNode = ({ data }: any) => {
  const { name, status, duration, isLast, isFirst } = data;

  const getStatusIcon = () => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'RUNNING':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-5 h-5 text-yellow-400" />
          </motion.div>
        );
      case 'SKIPPED':
        return <Clock className="w-5 h-5 text-slate-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-slate-700" />;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'SUCCESS': return 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
      case 'FAILED': return 'border-red-500/30 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
      case 'RUNNING': return 'border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_20px_rgba(245,158,11,0.15)]';
      default: return 'border-white/10 bg-white/5';
    }
  };

  return (
    <div className={`px-4 py-3 rounded-xl border backdrop-blur-md min-w-[180px] transition-all duration-500 ${getStatusClass()}`}>
      {!isFirst && <Handle type="target" position={Position.Left} className="!bg-slate-700 !w-2 !h-2 !border-none" />}
      
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-white truncate uppercase tracking-wider">{name}</span>
          {duration && (
            <span className="text-[10px] text-slate-400 font-mono">{duration}</span>
          )}
        </div>
      </div>

      {status === 'RUNNING' && (
        <motion.div 
          className="absolute -bottom-[1px] left-0 h-[2px] bg-yellow-400 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {!isLast && <Handle type="source" position={Position.Right} className="!bg-slate-700 !w-2 !h-2 !border-none" />}
    </div>
  );
};

export default memo(StageNode);
