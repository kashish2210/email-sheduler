"use client"
import { Search, Filter, RefreshCw } from 'lucide-react';

const Header = () => {
    return (
        <div className="workspace-header flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white">
            <div className="flex-1 max-w-2xl relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search"
                    className="workspace-search w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full focus:ring-1 focus:ring-green-500 outline-none text-sm"
                />
            </div>

            <div className="flex gap-4 text-gray-400">
                <button className="workspace-header-action hover:text-gray-600"><Filter size={20} /></button>
                <button className="workspace-header-action hover:text-gray-600"><RefreshCw size={20} /></button>
            </div>
        </div>
    );
};

export default Header;
