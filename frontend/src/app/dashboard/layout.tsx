"use client"
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="workspace-shell flex h-screen bg-white text-gray-900 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="workspace-main flex-1 overflow-y-auto bg-white">
                    {children}
                </main>
            </div>
        </div>
    );
}
