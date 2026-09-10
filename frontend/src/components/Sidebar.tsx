"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Send, Plus, Mail, BookOpen, Settings } from 'lucide-react';

const Sidebar = () => {
    const pathname = usePathname();

    const navItems = [
        { name: 'Scheduled', icon: Clock, path: '/dashboard' },
        { name: 'Sent', icon: Send, path: '/dashboard/sent' },
        { name: 'Docs', icon: BookOpen, path: '/dashboard/docs' },
        { name: 'SMTP setup', icon: Settings, path: '/dashboard/settings' },
    ];

    return (
        <div className="workspace-sidebar w-64 h-screen border-r border-gray-100 p-6 flex flex-col gap-8 bg-[#fcfcfc]">
            <div className="flex items-center gap-2 px-2">
                <Mail className="brand-icon w-8 h-8 text-[#00a854]" />
                <span className="brand-mark text-2xl font-bold">ONG</span>
            </div>

            <div className="flex flex-col gap-1">
                <div className="profile-card bg-gray-50 rounded-lg p-3 flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        <img src="https://ui-avatars.com/api/?name=Oliver+Brown" alt="avatar" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">Oliver Brown</p>
                        <p className="text-xs text-gray-500">oliver.brown@domain.io</p>
                    </div>
                </div>

                <Link
                    href="/dashboard/compose"
                    className="compose-link flex items-center justify-center gap-2 bg-white border border-[#00a854] text-[#00a854] py-2 rounded-full hover:bg-green-50 transition-all font-medium mb-8"
                >
                    <Plus size={18} /> Compose
                </Link>

                <p className="core-label text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Core</p>

                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.path}
                        className={`nav-link flex items-center justify-between px-3 py-2 rounded-md transition-colors ${pathname === item.path ? 'nav-link-active bg-green-50 text-[#00a854]' : 'nav-link-idle text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={18} />
                            <span className="font-medium">{item.name}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
