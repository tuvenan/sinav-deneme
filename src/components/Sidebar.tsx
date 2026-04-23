import { BookOpen, FolderOpen, LayoutDashboard, Settings, TrendingUp, Upload, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'calisma', label: 'Çalışma Alanı', icon: BookOpen },
    { id: 'analiz', label: 'Konu Analizi', icon: TrendingUp },
    { id: 'kaynaklar', label: 'Kaynaklarım', icon: FolderOpen },
  ];

  return (
    <aside className="w-64 fixed left-0 top-0 h-screen bg-surface border-r border-outline pt-20 hidden md:flex flex-col p-4 z-40">
      <div className="mb-8 px-2">
        <h2 className="text-lg font-bold font-serif text-primary">Öğrenci Paneli</h2>
        <p className="text-xs text-on-surface-variant font-medium">LGS Matematik Modu</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
              activeTab === item.id
                ? 'text-primary font-bold bg-surface-dim border-l-4 border-primary'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-dim'
            }`}
          >
            <item.icon size={18} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}

        <button className="w-full mt-6 flex items-center gap-3 px-3 py-2.5 text-primary border border-outline bg-surface-bright rounded-md transition-all hover:bg-surface-dim font-semibold italic text-sm">
          <Upload size={16} />
          <span>PDF/Kaynak Yükle</span>
        </button>
      </nav>

      <div className="mt-auto space-y-4">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setActiveTab('ai-rehber')}
          className={`w-full py-3 rounded-md font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'ai-rehber'
              ? 'bg-primary text-white scale-105'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          <Zap size={16} fill="currentColor" />
          AI Rehberine Sor
        </motion.button>

        <div className="pt-4 border-t border-outline">
          <button
            onClick={() => setActiveTab('ayarlar')}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all w-full text-left ${
              activeTab === 'ayarlar'
                ? 'text-primary font-bold bg-surface-dim border-l-4 border-primary'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-dim'
            }`}
          >
            <Settings size={18} />
            <span className="text-sm font-medium">Ayarlar</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
