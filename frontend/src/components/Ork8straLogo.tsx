import { motion } from 'framer-motion';

export const Ork8straLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
    <div className={`relative ${className} group`}>
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none overflow-visible">
            <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            {/* Background Rings */}
            <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="1" strokeOpacity="0.05" />
            <circle cx="50" cy="50" r="35" stroke="white" strokeWidth="1" strokeOpacity="0.05" />
            
            {/* The infinite orchestration loop */}
            <motion.path 
                d="M50 20 C 70 20, 85 35, 85 50 C 85 65, 70 80, 50 80 C 30 80, 15 65, 15 50 C 15 35, 30 20, 50 20" 
                stroke="url(#logo-grad)" 
                strokeWidth="10" 
                strokeLinecap="round"
                filter="url(#glow)"
                className="transition-all duration-500 group-hover:stroke-blue-400"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            
            {/* The Central Node */}
            <motion.rect 
                x="40" y="40" width="20" height="20" rx="4"
                fill="white"
                className="transition-all duration-500 group-hover:rotate-45"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            />
            
            {/* Connection Points (Nodes) */}
            <circle cx="50" cy="20" r="4" fill="white" className="group-hover:fill-blue-400 transition-colors" />
            <circle cx="85" cy="50" r="4" fill="white" className="group-hover:fill-blue-400 transition-colors" />
            <circle cx="50" cy="80" r="4" fill="white" className="group-hover:fill-blue-400 transition-colors" />
            <circle cx="15" cy="50" r="4" fill="white" className="group-hover:fill-blue-400 transition-colors" />
        </svg>
    </div>
);

export default Ork8straLogo;
