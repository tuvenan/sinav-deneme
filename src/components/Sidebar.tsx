import { BookOpen, FolderOpen, LayoutDashboard, Settings, TrendingUp, Upload, Zap, Shield, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onUploadClick: () => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onUploadClick, isMobileOpen, onClose }: SidebarProps) {
  const navItems = [
    { id: 'calisma', label: 'Çalışma Alanı', icon: BookOpen },
    { id: 'analiz', label: 'Konu Analizi', icon: TrendingUp },
    { id: 'mentor', label: 'Yapay Zeka Mentor', icon: Sparkles },
    { id: 'kaynaklar', label: 'Kaynaklarım', icon: FolderOpen },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay - closes sidebar on background click */}
      {isMobileOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[1px] z-35 md:hidden"
        />
      )}

      <aside className={`w-64 fixed left-0 top-0 h-screen bg-surface border-r border-outline pt-20 flex flex-col p-4 z-40 transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="mb-8 px-2">
        <h2 className="text-lg font-bold font-serif text-primary">Öğrenci Paneli</h2>
        <p className="text-xs text-on-surface-variant font-medium">LGS Matematik Modu</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              onClose?.();
            }}
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
      </nav>

      <div className="mt-auto">
        <div className="pt-4 border-t border-outline space-y-1">
          <button
            onClick={() => {
              setActiveTab('admin');
              onClose?.();
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all w-full text-left ${
              activeTab === 'admin'
                ? 'text-primary font-bold bg-surface-dim border-l-4 border-primary'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-dim'
            }`}
          >
            <Shield size={18} className="text-indigo-600" />
            <span className="text-sm font-medium">Admin Paneli</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ayarlar');
              onClose?.();
            }}
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
  </>
);
}
