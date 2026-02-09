import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';

export default function Layout() {
    return (
        <div className="h-screen w-screen bg-[#0F0F0F] text-[#E3E3E3] font-sans flex text-[13px] antialiased selection:bg-purple-500/30 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
                <main className="flex-1 overflow-y-auto w-full h-full bg-[#0F0F0F]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
