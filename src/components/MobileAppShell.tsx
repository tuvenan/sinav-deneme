import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  TrendingUp, 
  FolderOpen, 
  Settings, 
  Shield, 
  Wifi, 
  Battery, 
  Signal, 
  Sparkles, 
  Laptop, 
  Smartphone,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from './FirebaseContext';

interface MobileAppShellProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  correctStreak: number;
  children: React.ReactNode;
  isFocusActive?: boolean;
}

export default function MobileAppShell({ 
  activeTab, 
  setActiveTab, 
  correctStreak, 
  children,
  isFocusActive = false
}: MobileAppShellProps) {
  const { user } = useFirebase();
  const [deviceTime, setDeviceTime] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isPreviewMode, setIsPreviewMode] = useState(true); // Toggles between phone frame or full-width on desktop
  const [streakNotification, setStreakNotification] = useState(false);

  // Sync battery draining simulation
  useEffect(() => {
    const hours = new Date().getHours();
    // Simulate battery level based on time of day for high fidelity
    setBatteryLevel(Math.max(15, 100 - (hours * 2) % 60));

    const interval = setInterval(() => {
      const now = new Date();
      setDeviceTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    const now = new Date();
    setDeviceTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));

    return () => clearInterval(interval);
  }, []);

  // Show a lovely Dynamic Island pulse when streak changes
  useEffect(() => {
    if (correctStreak > 0) {
      setStreakNotification(true);
      const timer = setTimeout(() => {
        setStreakNotification(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [correctStreak]);

  // Standard phone bottom tabs
  const tabs = [
    { id: 'calisma', label: 'Çalışma', icon: BookOpen },
    { id: 'analiz', label: 'Analiz', icon: TrendingUp },
    { id: 'mentor', label: 'AI Mentor', icon: Sparkles },
    { id: 'kaynaklar', label: 'Kütüphane', icon: FolderOpen },
    { id: 'ayarlar', label: 'Ayarlar', icon: Settings },
  ];

  // Helper for Web Haptic Feedback
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([15]);
    }
  };

  // Viewport and Virtual Keyboard detection logic
  const [viewportHeight, setViewportHeight] = useState<number | string>('100dvh');
  const [maxHeight, setMaxHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      setViewportHeight(currentHeight);
      
      setMaxHeight(prev => {
        // Only update maximum if it seems like a real screen size (no keyboard)
        if (currentHeight > prev) return currentHeight;
        return prev;
      });
    };

    handleResize();

    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
      visualViewport.addEventListener('scroll', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handleResize);
        visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const isKeyboardOpen = isMobile && maxHeight > 0 && typeof viewportHeight === 'number' && (maxHeight - viewportHeight) > 120;

  const handleTabChange = (tabId: string) => {
    triggerHaptic();
    setActiveTab(tabId);
  };

  // Outer desktop background container (renders the phone or full container)
  const appContent = (
    <div className="flex flex-col h-full bg-background text-on-surface relative overflow-hidden">
      
      {/* HEADER CONTAINER (Collapses in Odak Modu) */}
      <motion.div
        animate={{ 
          height: isFocusActive ? 0 : 'auto', 
          opacity: isFocusActive ? 0 : 1,
          y: isFocusActive ? -100 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden shrink-0 z-30 flex flex-col"
      >
        {/* 1. TOP STATUS BAR (Native Mobile Feel) */}
        <div className="h-11 bg-white text-primary px-6 flex items-center justify-between text-xs font-semibold select-none z-30 border-b border-neutral-50 shrink-0">
          {/* Time and Network Name */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight">{deviceTime}</span>
            <span className="text-[10px] text-neutral-400 font-medium">Turkcell 5G</span>
          </div>

          {/* Dynamic Island Area / Streak alert */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1.5 z-50">
            <AnimatePresence mode="wait">
              {streakNotification ? (
                <motion.div 
                  initial={{ width: 110, height: 28, borderRadius: 20 }}
                  animate={{ width: 170, height: 32, borderRadius: 24 }}
                  exit={{ width: 110, height: 28, borderRadius: 20 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="bg-neutral-900 text-white flex items-center justify-center gap-1.5 shadow-lg overflow-hidden border border-neutral-800/50"
                >
                  <Sparkles size={12} className="text-yellow-400 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-wide whitespace-nowrap animate-fade-in">
                    Seri: {correctStreak} Soru 🔥
                  </span>
                </motion.div>
              ) : (
                /* Hidden standard physical camera notch on desktop simulator only */
                <div className="hidden md:block w-28 h-6 bg-black rounded-full border border-neutral-800" />
              )}
            </AnimatePresence>
          </div>

          {/* Icons (Signal, Wifi, Battery) */}
          <div className="flex items-center gap-1.5 text-neutral-800">
            <Signal size={12} className="text-primary" />
            <Wifi size={12} className="text-primary" />
            <div className="flex items-center gap-0.5">
              <span className="text-[9px] font-bold mr-0.5">{batteryLevel}%</span>
              <div className="relative w-5 h-2.5 border border-primary/80 rounded-[3px] p-[1px] flex items-center">
                <div 
                  className="h-full bg-emerald-500 rounded-[1px]" 
                  style={{ width: `${batteryLevel}%` }}
                />
                <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-1 bg-primary/80 rounded-r-[1px]" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. SUB HEADER (Mobile Branding & Shortcuts) */}
        <div className="px-4 py-3 bg-white border-b border-outline flex items-center justify-between shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            {/* Logo / Badge */}
            <div className="p-1.5 bg-primary/5 rounded-xl border border-primary/10">
              <Sparkles size={16} className="text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black font-serif text-primary tracking-tight">EduSınav Cep</h1>
              <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-0.5">Hybrid Mobil v2.4</p>
            </div>
          </div>

          {/* Shortcuts: Access Web Admin and Google Profile status */}
          <div className="flex items-center gap-2">
            {/* Go to Admin Web View Button */}
            <button 
              onClick={() => {
                triggerHaptic();
                setActiveTab('admin');
              }}
              className="flex items-center gap-1 px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
              title="Admin Yönetim Paneline Geç"
            >
              <Shield size={12} />
              <span>Admin Paneli</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 3. SCROLLABLE HYBRID APP VIEWS */}
      <div className={`flex-1 overflow-y-auto relative bg-background transition-all duration-200 ${isKeyboardOpen ? 'pb-4' : 'pb-24'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="p-1 xs:px-1.5 xs:py-2.5 sm:p-4 app-view-container"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4. BOTTOM NAVIGATION TAB BAR */}
      {!isKeyboardOpen && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-outline pb-5 pt-2 px-1.5 xs:px-3 z-30 shadow-2xl flex flex-col items-center">
          {/* Navigation Items Grid */}
          <div className="w-full grid grid-cols-5 gap-0.5 max-w-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="flex flex-col items-center justify-center py-1 rounded-2xl transition-all relative cursor-pointer"
                >
                  {/* Visual Accent behind active tab */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabGlow"
                      className="absolute -top-1 w-8 h-1 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}

                  <div className={`p-1 rounded-xl transition-all ${
                    isActive ? 'text-primary scale-110 bg-primary/5' : 'text-neutral-400 hover:text-neutral-600'
                  }`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  
                  <span className={`text-[9px] xs:text-[10px] font-medium tracking-tight transition-colors truncate w-full text-center ${
                    isActive ? 'text-primary font-black' : 'text-neutral-500'
                  }`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 5. VIRTUAL HOME INDICATOR (iOS / Android Style) */}
          <div className="w-32 h-1 bg-neutral-300 rounded-full mt-2.5 opacity-60 shrink-0 select-none pointer-events-none" />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-100/70 text-primary flex flex-col">
      
      {/* Upper Desktop Switcher Header (Invisible on actual mobile devices) */}
      <div className="hidden md:flex bg-white/90 backdrop-blur-md border-b border-outline px-6 py-2.5 justify-between items-center z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-neutral-600">
            Müşteri / Öğrenci görünümü **Hibrit Mobil Cihaz Simülatörü** olarak ayarlandı.
          </span>
        </div>
        
        {/* Interactive Mode Toggle */}
        <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl border border-outline">
          <button
            onClick={() => setIsPreviewMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isPreviewMode 
                ? 'bg-white text-primary shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Smartphone size={13} />
            <span>Mobil Telefon Çerçevesi</span>
          </button>
          <button
            onClick={() => setIsPreviewMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isPreviewMode 
                ? 'bg-white text-primary shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Laptop size={13} />
            <span>Tam Ekran Tarayıcı</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-0 md:p-4 bg-gradient-to-br from-neutral-50 via-neutral-100 to-indigo-50/20">
        {isPreviewMode ? (
          /* Rendered inside high-fidelity physical frame on desktop, transparent on mobile */
          <div 
            style={{ 
              height: isMobile && typeof viewportHeight === 'number' 
                ? `${viewportHeight}px` 
                : undefined 
            }}
            className="w-full h-[100dvh] md:h-[min(820px,86vh)] md:max-w-[390px] md:rounded-[48px] md:border-[11px] md:border-neutral-950 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] md:ring-[4px] md:ring-neutral-800/10 md:relative overflow-hidden bg-white transition-all duration-300 transform md:hover:shadow-primary/10"
          >
            {appContent}
          </div>
        ) : (
          /* Rendered full-screen on desktop */
          <div 
            style={{ 
              height: isMobile && typeof viewportHeight === 'number' 
                ? `${viewportHeight}px` 
                : undefined 
            }}
            className="w-full min-h-[calc(100vh-100px)] max-w-5xl md:rounded-3xl border border-outline shadow-xl overflow-hidden bg-white"
          >
            {appContent}
          </div>
        )}
      </div>
    </div>
  );
}
