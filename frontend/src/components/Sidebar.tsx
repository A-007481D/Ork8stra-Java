import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutGrid,
    Layers,
    ChevronRight,
    Building2,
    LogOut,
    User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors group mb-1",
            collapsed ? 'justify-center' : 'justify-between',
            active
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
        )}
        title={collapsed ? label : undefined}
    >
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center w-full")}>
            <Icon className={cn("w-4 h-4 transition-colors", active ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
            {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
        </div>
    </button>
);

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
        { label: 'Projects', path: '/projects', icon: Layers },
        // Add more items as needed
    ];

    return (
        <motion.div
            initial={false}
            animate={{ width: isSidebarOpen ? 240 : 60 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="h-full bg-[#141414] border-r border-[#242424] flex flex-col shrink-0 relative z-30"
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute -right-3 top-6 w-6 h-6 bg-[#141414] border border-[#242424] rounded-full flex items-center justify-center text-[#666] hover:text-[#E3E3E3] z-50 shadow-sm transition-colors"
            >
                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-200", isSidebarOpen ? 'rotate-180' : '0')} />
            </button>

            {/* Header / Org Switcher style */}
            <div className="p-4 border-b border-[#222]">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
                        <Building2 className="w-4 h-4 text-white" />
                    </div>
                    {isSidebarOpen && (
                        <div className="transition-opacity duration-200">
                            <h2 className="text-sm font-semibold text-[#E3E3E3]">KubeLite</h2>
                            <p className="text-[10px] text-[#666] uppercase tracking-wider font-medium">Workspace</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats / Context (Optional) */}
            {isSidebarOpen && (
                <div className="px-4 py-3 border-b border-[#222]">
                    <div className="flex items-center justify-between text-xs text-[#666] mb-1">
                        <span>Status</span>
                        <span className="text-emerald-500 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Online
                        </span>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3">
                {navItems.map((item) => (
                    <SidebarItem
                        key={item.path}
                        icon={item.icon}
                        label={item.label}
                        active={location.pathname === item.path}
                        collapsed={!isSidebarOpen}
                        onClick={() => navigate(item.path)}
                    />
                ))}
            </div>

            {/* User Footer */}
            <div className="p-3 border-t border-[#222]">
                <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={cn(
                        "w-full flex items-center rounded-md p-2 hover:bg-[#1A1A1A] transition-colors group relative",
                        !isSidebarOpen && "justify-center"
                    )}
                >
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 shrink-0">
                        {user?.username?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                    </div>

                    {isSidebarOpen && (
                        <div className="ml-3 text-left overflow-hidden flex-1">
                            <p className="text-sm font-medium text-slate-300 truncate">{user?.username || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">Pro Plan</p>
                        </div>
                    )}

                    {isSidebarOpen && (
                        <LogOut
                            className="w-4 h-4 text-slate-500 hover:text-red-400 ml-2 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                logout();
                            }}
                        />
                    )}
                </button>
            </div>
        </motion.div>
    );
}
