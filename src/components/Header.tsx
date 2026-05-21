import React, { useState, useEffect } from 'react';
import { Bell, Search, Timer } from 'lucide-react';

export default function Header() {
  const [name, setName] = useState('Deniz Yılmaz');
  const [avatarSeed, setAvatarSeed] = useState('Felix');

  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('lgs_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.name) setName(parsed.name);
          if (parsed.avatarSeed) setAvatarSeed(parsed.avatarSeed);
        } catch (e) {
          // ignore
        }
      }
    };

    loadSettings();

    // Listen for custom dispatch events or storage updates to keep synchronized instantly
    window.addEventListener('storage', loadSettings);
    return () => {
      window.removeEventListener('storage', loadSettings);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-outline z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold font-serif text-primary tracking-tight">LGS Mentor AI</span>
        <div className="hidden md:flex items-center bg-surface-dim px-3 py-1.5 rounded-md border border-outline">
          <Search size={16} className="text-on-surface-variant" />
          <input
            type="text"
            placeholder="Konu veya soru ara..."
            className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-48 placeholder:text-on-surface-variant/60 text-on-surface"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-primary font-semibold bg-surface-dim border border-outline">
          <Timer size={16} />
          <span className="text-sm font-sans">24:15</span>
        </div>

        <button className="p-2 rounded-full hover:bg-surface-dim transition-colors text-on-surface-variant">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs font-bold text-primary font-serif italic">{name}</span>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
              alt={name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
