import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Check, Info, AlertCircle, Calendar } from 'lucide-react';
import type { Notification, NotificationType } from '../types/index';

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    token: string;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, token }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/notifications?size=20', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/v1/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            }
        } catch (e) {
            console.error('Failed to mark as read', e);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch('/api/v1/notifications/read-all', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }
        } catch (e) {
            console.error('Failed to mark all as read', e);
        }
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'DEPLOY_SUCCESS':
            case 'BUILD_COMPLETED':
                return <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Check className="w-4 h-4" /></div>;
            case 'DEPLOY_FAILED':
            case 'SECURITY_ALERT':
                return <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500"><AlertCircle className="w-4 h-4" /></div>;
            case 'ROLE_CHANGED':
            case 'TEAM_INVITE':
                return <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500"><Info className="w-4 h-4" /></div>;
            default:
                return <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-[#888]"><Bell className="w-4 h-4" /></div>;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0F0F0F] border-l border-[#242424] shadow-2xl z-[101] flex flex-col"
                    >
                        <div className="p-6 border-b border-[#242424] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#1A1A1A] rounded-lg border border-[#2C2C2C]">
                                    <Bell className="w-5 h-5 text-[#E3E3E3]" />
                                </div>
                                <h2 className="text-xl font-semibold text-[#E3E3E3]">Notifications</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {notifications.some(n => !n.read) && (
                                    <button 
                                        onClick={markAllAsRead}
                                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors mr-2 px-2 py-1 hover:bg-purple-500/10 rounded-md"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                                <button 
                                    onClick={onClose}
                                    className="p-2 hover:bg-[#1A1A1A] rounded-full text-[#666] hover:text-[#E3E3E3] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                            {loading && notifications.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="h-24 bg-[#141414] animate-pulse rounded-xl border border-[#242424]" />
                                ))
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-[#666] space-y-4">
                                    <div className="w-16 h-16 bg-[#141414] rounded-full flex items-center justify-center border border-[#242424]">
                                        <Bell className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div 
                                        key={n.id}
                                        onClick={() => !n.read && markAsRead(n.id)}
                                        className={`p-4 rounded-xl border transition-all relative group cursor-pointer ${
                                            n.read ? 'bg-transparent border-[#242424] opacity-60' : 'bg-[#141414] border-[#333] shadow-lg shadow-purple-500/5'
                                        }`}
                                    >
                                        {!n.read && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />}
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-[#E3E3E3] mb-1">{n.title}</h4>
                                                <p className="text-xs text-[#888] leading-relaxed mb-3">{n.message}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-[#555]">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationPanel;
