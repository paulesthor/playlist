import React from 'react';
import { Library, Search, PlaySquare, BarChart2, Sparkles } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
    const tabs = [
        { id: 'library', label: 'Your Library', icon: Library },
        { id: 'search', label: 'Search', icon: Search },
        { id: 'swipe', label: 'Swipe', icon: PlaySquare },
        { id: 'insights', label: 'Stats', icon: BarChart2 },
        { id: 'ai', label: 'AI DJ', icon: Sparkles },
    ];

    return (
        <div className="bg-[#121212] bg-opacity-95 backdrop-blur-md">
            <div className="flex justify-around items-center h-[64px]">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors group"
                            style={{ WebkitTapHighlightColor: 'transparent' }} // Remove touch highlight on mobile
                        >
                            <Icon
                                size={24}
                                className={`transition-all duration-200 ${isActive ? 'text-white' : 'text-spotify-grey group-hover:text-gray-300'}`}
                            />
                            <span className={`text-[10px] transition-all duration-200 ${isActive ? 'text-white font-medium' : 'text-spotify-grey font-normal'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
