import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CreditCard, 
  Shield, 
  User, 
  Download, 
  Check, 
  AlertTriangle, 
  Key, 
  Mail, 
  Sparkles, 
  RefreshCw, 
  Trophy, 
  BookOpen, 
  Clock, 
  Heart,
  Smartphone,
  CheckCircle2,
  Lock,
  Plus,
  LogIn,
  LogOut
} from 'lucide-react';
import type { SolveHistory } from '../types';
import { useFirebase } from './FirebaseContext';
import { updateUserProfile } from '../lib/db';

interface SettingsViewProps {
  solveHistory?: SolveHistory[];
}

interface UserSettings {
  name: string;
  targetSchool: string;
  dailyGoal: number;
  avatarSeed: string;
  notifySms: boolean;
  notifyDaily: boolean;
  notifyAiMentorship: boolean;
  notifyTime: string;
  membershipType: 'Standart' | 'Premium LGS Şampiyon';
}

const DEFAULT_SETTINGS: UserSettings = {
  name: 'Deniz Yılmaz',
  targetSchool: 'Kabataş Erkek Lisesi',
  dailyGoal: 50,
  avatarSeed: 'Felix',
  notifySms: true,
  notifyDaily: true,
  notifyAiMentorship: true,
  notifyTime: '18:30',
  membershipType: 'Standart'
};

const AVATARS = [
  { seed: 'Felix', name: 'Zeki Felix' },
  { seed: 'Aria', name: 'Çalışkan Aria' },
  { seed: 'Leo', name: 'Hevesli Leo' },
  { seed: 'Bella', name: 'Meraklı Bella' },
  { seed: 'student', name: 'Klasik LGS bükücü' },
];

export default function SettingsView({ solveHistory = [] }: SettingsViewProps) {
  const { user, signInWithGoogle, logout } = useFirebase();
  // Load settings from localStorage or fallback
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('lgs_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Current sub-section selected
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'billing'>('profile');
  
  // Save/Notification messages state
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [testNotificationMsg, setTestNotificationMsg] = useState<string | null>(null);

  // Profile Form States
  const [profileName, setProfileName] = useState(settings.name);
  const [profileTargetSchool, setProfileTargetSchool] = useState(settings.targetSchool);
  const [profileDailyGoal, setProfileDailyGoal] = useState(settings.dailyGoal);
  const [profileAvatar, setProfileAvatar] = useState(settings.avatarSeed);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetVerifyText, setResetVerifyText] = useState('');

  // Payment Modal & Billing State
  const [selectedPlanToSubscribe, setSelectedPlanToSubscribe] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Handle outside database settings change sync
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('lgs_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) {
            setSettings(parsed);
            if (parsed.name) setProfileName(parsed.name);
            if (parsed.targetSchool) setProfileTargetSchool(parsed.targetSchool);
            if (parsed.dailyGoal) setProfileDailyGoal(parsed.dailyGoal);
            if (parsed.avatarSeed) setProfileAvatar(parsed.avatarSeed);
          }
        } catch (e) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save profile settings
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...settings,
      name: profileName,
      targetSchool: profileTargetSchool,
      dailyGoal: profileDailyGoal,
      avatarSeed: profileAvatar
    };
    setSettings(updated);
    localStorage.setItem('lgs_settings', JSON.stringify(updated));
    showSuccessBanner();

    // Trigger local storage storage event for Header update
    window.dispatchEvent(new Event('storage'));

    if (user) {
      updateUserProfile(user.uid, {
        name: profileName,
        targetSchool: profileTargetSchool,
        dailyGoal: profileDailyGoal,
        avatarSeed: profileAvatar
      }).catch(err => console.error("Firestore settings update error:", err));
    }
  };

  // Save notification preferences
  const handleSaveNotifications = (
    sms: boolean, 
    daily: boolean, 
    ai: boolean, 
    time: string
  ) => {
    const updated = {
      ...settings,
      notifySms: sms,
      notifyDaily: daily,
      notifyAiMentorship: ai,
      notifyTime: time
    };
    setSettings(updated);
    localStorage.setItem('lgs_settings', JSON.stringify(updated));
    showSuccessBanner();

    if (user) {
      updateUserProfile(user.uid, {
        notifySms: sms,
        notifyDaily: daily,
        notifyAiMentorship: ai,
        notifyTime: time
      }).catch(err => console.error("Firestore notification preference update error:", err));
    }
  };

  const showSuccessBanner = () => {
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 4000);
  };

  // Trigger Mock Browser Notification Banner inside the UI
  const triggerTestNotificationMsg = () => {
    const messages = [
      "🔔 LGS Mentor AI: 'Bugün henüz hedefine ulaşamadın. Üslü sayılardan 10 soru çözerek başlamaya ne dersin?'",
      "🎯 Hedef Güncellemesi: Kabataş Erkek Lisesi kazanma ihtimalin bu hafta %2.4 arttı!",
      "💡 AI Mentor Önerisi: Son denemendeki felsefe/türkçe sorularından ötürü okuma hızını artırmak için paragraf kaynaklarına göz atmalısın.",
      "🚀 Süreç Raporu: Haftalık çalışma turların tamamlandı! PDF/Kaynaklar sayfasından yeni raporunu inceleyebilirsin."
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setTestNotificationMsg(randomMsg);
    setTimeout(() => {
      setTestNotificationMsg(null);
    }, 5000);
  };

  // Password Update Simulated Flow
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityError('Lütfen tüm şifre alanlarını eksiksiz doldurun.');
      return;
    }
    if (newPassword.length < 6) {
      setSecurityError('Yeni şifre en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError('Girdiğiniz yeni şifreler uyuşmuyor.');
      return;
    }

    setSecuritySuccess('Şifreniz başarıyla güncellendi!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSecuritySuccess(null), 4000);
  };

  // Safe Data Wipe logic
  const handleWipeAllData = () => {
    const normalized = resetVerifyText.trim().toLowerCase();
    if (normalized !== 'sıfırla' && normalized !== 'sifirla') {
      alert('Sıfırlama işlemini onaylamak için kutucuğa SIFIRLA yazmalısınız.');
      return;
    }
    localStorage.clear();
    alert('Sistemdeki tüm çözüm geçmişi, ayarlar ve yüklediğiniz kaynaklar başarıyla silindi. Sayfa yenileniyor...');
    window.location.reload();
  };

  // Premium Subscribe Handler
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);

    setTimeout(() => {
      setIsPaying(false);
      setPaymentSuccess(true);
      
      const upgradedSettings: UserSettings = {
        ...settings,
        membershipType: 'Premium LGS Şampiyon'
      };
      setSettings(upgradedSettings);
      localStorage.setItem('lgs_settings', JSON.stringify(upgradedSettings));

      // Trigger local storage change
      window.dispatchEvent(new Event('storage'));

      if (user) {
        updateUserProfile(user.uid, {
          membershipType: 'Premium LGS Şampiyon'
        }).catch(err => console.error("Firestore membership upgrade error:", err));
      }

      setTimeout(() => {
        setPaymentSuccess(false);
        setSelectedPlanToSubscribe(null);
        // Clear payment forms
        setCardNumber('');
        setCardHolder('');
        setCardExpiry('');
        setCardCvc('');
      }, 3000);
    }, 2000);
  };

  const handleExportData = () => {
    try {
      const dataPayload = {
        app: "LGS Mentor AI",
        savedAt: new Date().toISOString(),
        totalSolved: solveHistory.length,
        settings: settings,
        history: solveHistory
      };
      const blob = new Blob([JSON.stringify(dataPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lgs_mentor_ai_performans_verisi_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Veri dışa aktarımı başarısız oldu", error);
    }
  };

  return (
    <div className="p-4 sm:p-8 lg:p-12 max-w-5xl mx-auto space-y-8 animate-slide-up relative">
      
      {/* Top Banner Message */}
      {showSaveSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-50 text-emerald-800 border border-emerald-200 px-5 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-scale-up">
          <div className="p-1 rounded-full bg-emerald-500 text-white leading-none">
            <Check size={14} />
          </div>
          <div>
            <p className="text-xs font-bold font-serif italic">Başarı!</p>
            <p className="text-[10px] text-emerald-700">Tüm tercihleriniz ve ayarlarınız başarıyla kaydedildi.</p>
          </div>
        </div>
      )}

      {/* Test Interactive Notification Simulator Banner */}
      {testNotificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-primary/20 p-4 rounded-2xl shadow-xl max-w-sm flex gap-3 animate-slide-up bg-surface-bright border-l-4 border-l-primary">
          <div className="p-2 h-max rounded-lg bg-primary/10 text-primary">
            <Bell size={18} className="animate-swing" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-widest text-primary font-mono">LGS Mentor AI Simülatorü</p>
            <p className="text-xs text-on-surface leading-normal font-medium">{testNotificationMsg}</p>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="space-y-1.5 border-b border-outline pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-primary italic">Sistem ve Profil Ayarları</h1>
            <p className="text-xs text-on-surface-variant">Kişisel hedeflerini, bildirim sistemini ve AI premium özelliklerini buradan özelleştir.</p>
          </div>
          
          <div className="flex items-center gap-2 self-start">
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
              settings.membershipType === 'Premium LGS Şampiyon' 
                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                : 'bg-stone-50 border-stone-200 text-stone-600'
            }`}>
              {settings.membershipType === 'Premium LGS Şampiyon' ? '⭐ Premium Üye' : 'Standart Plan'}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal / Grid Layout for settings layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side Sub-Navigation Drawer/Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-outline rounded-2xl overflow-hidden p-2 space-y-1 shadow-sm">
            
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-on-surface-variant hover:bg-surface-dim hover:text-primary'
              }`}
            >
              <User size={16} />
              <span>Profil Yönetimi</span>
            </button>

            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'notifications' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-on-surface-variant hover:bg-surface-dim hover:text-primary'
              }`}
            >
              <Bell size={16} />
              <span>Bildirimler</span>
            </button>

            <button 
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'security' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-on-surface-variant hover:bg-surface-dim hover:text-primary'
              }`}
            >
              <Shield size={16} />
              <span>Güvenlik</span>
            </button>

            <button 
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'billing' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-on-surface-variant hover:bg-surface-dim hover:text-primary'
              }`}
            >
              <CreditCard size={16} />
              <span>Plan & Ödeme</span>
            </button>

          </div>

          {/* Quick Stats Summary Card under Tabs in Left Column */}
          <div className="bg-surface-dim/30 border border-outline rounded-2xl p-5 space-y-3 shadow-inner">
            <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">Mevcut İlerleme</span>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Çözülen Soru</span>
                <span className="font-bold text-primary">{solveHistory.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Öğrenme Hızı</span>
                <span className="font-bold text-primary">Yüksek</span>
              </div>
              <div className="w-full bg-surface-dim h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[65%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Settings Area Box */}
        <div className="lg:col-span-3 bg-white border border-outline rounded-2xl p-6 sm:p-8 shadow-sm min-h-[480px] flex flex-col">
          
          {/* 1. PROFILE SECTION IMPLEMENTATION */}
          {activeTab === 'profile' && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <User size={20} className="text-primary" />
                  <h3 className="font-serif font-black underline underline-offset-4 text-lg text-primary">Profil Bilgilerini Güncelle</h3>
                </div>
                <p className="text-xs text-on-surface-variant">AI Mentorun sana isminle hitap edebilmesi ve hedefine uygun soru listesi planlaması için bilgilerin eksiksiz olmalıdır.</p>

                {/* Firebase Google Auth Connection Card */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white border border-outline rounded-xl flex items-center justify-center text-primary shadow-sm h-12 w-12 shrink-0 overflow-hidden">
                      {user && user.photoURL ? (
                        <img src={user.photoURL} alt="Google Avatar" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <LogIn size={20} className="text-primary animate-pulse" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-serif font-black text-primary italic">Bulut Veritabanı Yedeklemesi</p>
                      {user ? (
                        <p className="text-[11px] text-on-surface-variant leading-tight">
                          E-posta: <span className="font-semibold text-primary">{user.email}</span> ile bağlı durumda. İlerlemeniz otomatik yedekleniyor.
                        </p>
                      ) : (
                        <p className="text-[11px] text-on-surface-variant leading-tight">
                          Hesabınızı senkronize edin! Sınav istatistikleriniz, çalışma planınız ve tüm PDF'leriniz güvenle saklanır.
                        </p>
                      )}
                    </div>
                  </div>
                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Google bağlantısını kesmek istediğinizden emin misiniz?')) {
                          logout();
                        }
                      }}
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-on-surface/5 hover:bg-on-surface/10 rounded-xl text-[11px] font-bold uppercase tracking-wider text-on-surface-variant cursor-pointer border border-outline transition-all"
                    >
                      <LogOut size={13} />
                      <span>Bağlantıyı Kes</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        signInWithGoogle().then(u => {
                          if (u) {
                            alert(`Hoş geldin, LGS Şampiyonu ${u.displayName}! Firestore veritabanı başarıyla bağlandı.`);
                          }
                        });
                      }}
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest cursor-pointer shadow-md shadow-primary/25 hover:shadow-lg transition-all"
                    >
                      <LogIn size={13} />
                      <span>Google ile Eşle</span>
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary block">Ad Soyad</label>
                      <input 
                        type="text" 
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full font-medium text-xs p-3 border border-outline rounded-xl bg-surface-dim/20 focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Örn: Deniz Yılmaz"
                        required
                      />
                    </div>
                    {/* Target High School */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary block">Hedef Lise</label>
                      <input 
                        type="text" 
                        value={profileTargetSchool}
                        onChange={(e) => setProfileTargetSchool(e.target.value)}
                        className="w-full font-medium text-xs p-3 border border-outline rounded-xl bg-surface-dim/20 focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Örn: Kabataş Erkek Lisesi"
                        required
                      />
                    </div>
                  </div>

                  {/* Daily Goal Slider */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary">Günlük Soru Çözme Hedefi</label>
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg">{profileDailyGoal} Soru/Gün</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="150" 
                      step="5"
                      value={profileDailyGoal}
                      onChange={(e) => setProfileDailyGoal(Number(e.target.value))}
                      className="w-full h-2 bg-surface-dim rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-on-surface-variant font-bold">
                      <span>10 Soru (Isınma)</span>
                      <span>50 Soru (Ortalama)</span>
                      <span>150 Soru (Dinamik Şampiyon)</span>
                    </div>
                  </div>

                  {/* Avatar Picker */}
                  <div className="space-y-3 pt-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary block">Avatar Seçimi (Karakter Özelliği)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {AVATARS.map((av) => (
                        <button
                          key={av.seed}
                          type="button"
                          onClick={() => setProfileAvatar(av.seed)}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                            profileAvatar === av.seed 
                              ? 'border-primary bg-primary/[0.03] scale-105' 
                              : 'border-outline hover:border-primary/50 bg-white'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-outline bg-surface-dim">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${av.seed}`}
                              alt={av.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-center leading-tight truncate w-full text-on-surface-variant">
                            {av.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <hr className="border-outline pt-2" />

                  {/* Save button */}
                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit"
                      className="px-6 py-3 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Check size={14} />
                      Profili Kaydet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 2. NOTIFICATIONS SECTION IMPLEMENTATION */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Bell size={20} className="text-primary" />
                  <h3 className="font-serif font-black underline underline-offset-4 text-lg text-primary">Bildirim ve Hatırlatma Tercihleri</h3>
                </div>
                <p className="text-xs text-on-surface-variant">Kontrol sende! AI Mentorunun seni ne sıklıkla ve hangi kanallarla fısıldayacağını belirt.</p>

                <div className="space-y-4">
                  {/* SMS / E-posta Toggle */}
                  <div className="flex items-center justify-between p-4 border border-outline bg-surface-dim/20 rounded-xl">
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="font-bold text-xs text-primary uppercase tracking-tight flex items-center gap-1.5">
                        <Smartphone size={14} />
                        Haftalık SMS Raporları
                      </p>
                      <p className="text-[10px] text-on-surface-variant">Ebeveynlerine veya sana haftalık gelişim, net analizi ve eksikler tablosunu SMS ile iletir.</p>
                    </div>
                    <button
                      onClick={() => handleSaveNotifications(!settings.notifySms, settings.notifyDaily, settings.notifyAiMentorship, settings.notifyTime)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors flex cursor-pointer ${
                        settings.notifySms ? 'bg-primary justify-end' : 'bg-outline-variant justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* Daily Smart reminder */}
                  <div className="flex items-center justify-between p-4 border border-outline bg-surface-dim/20 rounded-xl">
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="font-bold text-xs text-primary uppercase tracking-tight flex items-center gap-1.5">
                        <Clock size={14} />
                        Günlük Çalışma Hatırlatıcı
                      </p>
                      <p className="text-[10px] text-on-surface-variant">Belirttiğin soru çözme hedefine ulaşmadığında seni teşvik eden akıllı bildirim yollar.</p>
                    </div>
                    <button
                      onClick={() => handleSaveNotifications(settings.notifySms, !settings.notifyDaily, settings.notifyAiMentorship, settings.notifyTime)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors flex cursor-pointer ${
                        settings.notifyDaily ? 'bg-primary justify-end' : 'bg-outline-variant justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* AI Motivation Tips reminder */}
                  <div className="flex items-center justify-between p-4 border border-outline bg-surface-dim/20 rounded-xl">
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="font-bold text-xs text-primary uppercase tracking-tight flex items-center gap-1.5">
                        <Sparkles size={14} />
                        Yapay Zeka Mentor Motivasyon Fısıltıları
                      </p>
                      <p className="text-[10px] text-on-surface-variant">Moral veya motivasyonunun düştüğü anlarda AI sisteminden özel motivasyon iletileri al.</p>
                    </div>
                    <button
                      onClick={() => handleSaveNotifications(settings.notifySms, settings.notifyDaily, !settings.notifyAiMentorship, settings.notifyTime)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors flex cursor-pointer ${
                        settings.notifyAiMentorship ? 'bg-primary justify-end' : 'bg-outline-variant justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* Preferred Notification Time Picker */}
                  <div className="p-4 border border-outline/75 bg-surface-dim/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-primary uppercase tracking-tight block">Hatırlatma Saati</p>
                      <p className="text-[10px] text-on-surface-variant">Akşam tekrarları ve motivasyon bildirimleri için en ideal saat dilimin.</p>
                    </div>
                    <input 
                      type="time" 
                      value={settings.notifyTime}
                      onChange={(e) => handleSaveNotifications(settings.notifySms, settings.notifyDaily, settings.notifyAiMentorship, e.target.value)}
                      className="px-3 py-1.5 font-bold font-mono text-xs border border-outline rounded-xl bg-surface focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-32"
                    />
                  </div>
                </div>

                {/* Simulated testing button inside the tab to let them see it */}
                <div className="pt-4 border-t border-outline/75 flex justify-between items-center flex-wrap gap-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-primary">Teşvik Sistemini Dene</p>
                    <p className="text-[10px] text-on-surface-variant">Küçük motivasyon bildirimlerinin neye benzediğini simüle et.</p>
                  </div>
                  <button
                    type="button"
                    onClick={triggerTestNotificationMsg}
                    className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-primary/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles size={13} className="animate-pulse" />
                    Test Bildirimi Tetikle
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. SECURITY SECTION IMPLEMENTATION */}
          {activeTab === 'security' && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-primary" />
                  <h3 className="font-serif font-black underline underline-offset-4 text-lg text-primary">Hesap ve Veri Güvenliği</h3>
                </div>
                <p className="text-xs text-on-surface-variant">Şifreni yenileyebilir veya tarayıcında saklanan verilerini ve çözüm puanlarını yönetebilirsin.</p>

                {securityError && (
                  <div className="bg-rose-50 text-rose-800 border border-rose-100 p-3.5 rounded-lg text-xs leading-normal flex items-start gap-2 animate-scale-up font-medium">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <span>{securityError}</span>
                  </div>
                )}

                {securitySuccess && (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3.5 rounded-lg text-xs leading-normal flex items-start gap-2 animate-scale-up font-medium">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                    <span>{securitySuccess}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary block">Mevcut Şifre</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full text-xs p-3 border border-outline rounded-xl bg-surface-dim/20 focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary block">Yeni Şifre</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full text-xs p-3 border border-outline rounded-xl bg-surface-dim/20 focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="En az 6 karakter"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-primary block">Yeni Şifre (Yeniden)</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-xs p-3 border border-outline rounded-xl bg-surface-dim/20 focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Tekrar yazın"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Key size={14} />
                      Şifreyi Güncelle
                    </button>
                  </div>
                </form>

                {/* Hard Wipe Data Block */}
                <div className="pt-6 border-t border-rose-100 bg-rose-50/20 p-5 rounded-2xl border border-dashed space-y-3">
                  <h4 className="font-serif font-bold text-sm text-rose-800 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-rose-600 animate-pulse" />
                    Kritik Bölge: Tüm Mentor Geçmişini Sıfırla
                  </h4>
                  <p className="text-[11px] text-rose-700/80 leading-normal font-medium">Bu işlem çözdüğün tüm geçmiş soruları, yapay zeka analiz gelişim grafiklerini, başarı kütüphanesine eklediğin PDF ders notlarını kalıcı olarak tarayıcından SİLER. Geri dönüştürülemez.</p>
                  
                  {!showResetConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="px-4 py-2 bg-rose-500/10 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                    >
                      Verilerimi Kalıcı Olarak Yok Et
                    </button>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-rose-800 block">Onaylamak için kutuya büyük harflerle "SIFIRLA" yazın:</label>
                        <input 
                          type="text"
                          value={resetVerifyText}
                          onChange={(e) => setResetVerifyText(e.target.value)}
                          placeholder="SIFIRLA"
                          className="px-3 py-2 bg-white text-xs border border-rose-200 text-rose-900 rounded-lg w-full max-w-xs focus:ring-rose-500 focus:outline-none font-bold"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleWipeAllData}
                          className="px-4 py-2 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-rose-700 transition-all cursor-pointer"
                        >
                          Kesin Olarak Sıfırla
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowResetConfirm(false);
                            setResetVerifyText('');
                          }}
                          className="px-4 py-2 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-stone-200 transition-all cursor-pointer border border-stone-200"
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* 4. BILLING & MEBERSHIP SCHEME UPGRADE TAB */}
          {activeTab === 'billing' && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  <h3 className="font-serif font-black underline underline-offset-4 text-lg text-primary">Abonelik & AI Şampiyon Paketi</h3>
                </div>
                <p className="text-xs text-on-surface-variant">LGS hazırlığı süresince sınırları ortadan kaldır! Üyelik planlarını karşılaştır ve AI imkanlarını sonuna kadar genişlet.</p>

                {/* Current plan detail indicator */}
                <div className={`p-5 rounded-2xl border ${
                  settings.membershipType === 'Premium LGS Şampiyon' 
                    ? 'bg-rose-50/50 border-rose-200 text-rose-950 shadow-sm' 
                    : 'bg-stone-50 border-stone-200 text-stone-900'
                } flex flex-col sm:flex-row items-center justify-between gap-4`}>
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-mono font-black tracking-widest uppercase text-primary">Mevcut Durum</span>
                    <h4 className="font-serif font-black text-lg text-primary italic">
                      {settings.membershipType === 'Premium LGS Şampiyon' ? '⭐ Premium LGS Şampiyon Üyeliği' : 'LGS Mentor Klasik (Ücretsiz)'}
                    </h4>
                    <p className="text-xs text-on-surface-variant">
                      {settings.membershipType === 'Premium LGS Şampiyon' 
                        ? 'Sınırsız AI çalışma desteği, ebeveyn raporları ve haftalık koçluk simülatörü aktif.' 
                        : 'Kısıtlı günlük AI mentor soru ve sınırlı deneme analizi imkanı.'}
                    </p>
                  </div>
                  {settings.membershipType === 'Premium LGS Şampiyon' && (
                    <div className="px-4 py-2 rounded-xl bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest shrink-0 animate-pulse">
                      AKTİF & SINIRSIZ
                    </div>
                  )}
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-outline"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-on-surface-variant/75 uppercase tracking-widest font-black">Planları Karşılaştır</span>
                  <div className="flex-grow border-t border-outline"></div>
                </div>

                {/* Pricing comparison tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Free Plan */}
                  <div className="border border-outline bg-white p-5 rounded-2xl space-y-4 relative flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono tracking-widest uppercase text-stone-500 font-bold">LGS Standart</span>
                        <h5 className="font-serif font-bold text-md text-primary">Klasik Paket</h5>
                        <p className="text-[10px] text-on-surface-variant">Temel hazırlık adımları ve kısıtlı turlar.</p>
                      </div>
                      <div className="text-xl font-serif font-bold text-primary">Ücretsiz <span className="text-xs font-sans text-on-surface-variant">/ ömür boyu</span></div>
                      
                      <hr className="border-outline" />
                      <ul className="space-y-2 text-[10px] text-on-surface-variant font-bold">
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Günlük 15 Adet AI Matematik Çözümü</li>
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Ders Kaynağı Notları Yükleme</li>
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Grafik Analiz Özeti</li>
                        <li className="flex items-center gap-1.5 text-stone-400 line-through"><Lock size={10} /> Haftalık Detaylı Velimize SMS Raporu</li>
                        <li className="flex items-center gap-1.5 text-stone-400 line-through"><Lock size={10} /> Sınırsız Yapay Zeka AI Tutor Sohbeti</li>
                      </ul>
                    </div>
                    
                    <button
                      type="button"
                      disabled
                      className="w-full text-center py-2.5 bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-not-allowed border border-stone-200 mt-2"
                    >
                      Şu An Kullanılıyor
                    </button>
                  </div>

                  {/* Premium Plan Champion */}
                  <div className="border-2 border-primary bg-primary/[0.01] p-5 rounded-2xl space-y-4 relative flex flex-col justify-between shadow-md">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-sm">
                      ✨ EN POPÜLER & ŞAMPİYON
                    </div>
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono tracking-widest uppercase text-primary font-black">LGS Premium</span>
                        <h5 className="font-serif font-black text-md text-primary italic">AI Şampiyon Paketi</h5>
                        <p className="text-[10px] text-on-surface-variant">Sınavı kazandıracak tam teçhizatlı mental & akademik yol arkadaşı.</p>
                      </div>
                      <div className="text-xl font-serif font-bold text-primary">199 ₺ <span className="text-xs font-sans text-on-surface-variant">/ Aylık</span></div>
                      
                      <hr className="border-primary/20" />
                      <ul className="space-y-2 text-[10px] text-primary/95 font-bold">
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-primary" /> <strong>Sınırsız</strong> Yapay Zeka Soru Çözümü</li>
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-primary" /> <strong>Veli SMS Bildirim Sistemi</strong> Aktif</li>
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-primary" /> Detaylı Kazanım Başına Gelişim Tahminleri</li>
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-primary" /> PDF ve Video Çözüm Yüklemelerinde Sınırsız AI Tarayıcı</li>
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-primary" /> Yeni Kazanım Setlik Sınıf Arkadaşları Liderlik Tablosu</li>
                      </ul>
                    </div>

                    {settings.membershipType === 'Premium LGS Şampiyon' ? (
                      <button
                        type="button"
                        disabled
                        className="w-full text-center py-2.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-not-allowed mt-2"
                      >
                        ✓ Şampiyonluk Planınız Aktif
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedPlanToSubscribe('AI Şampiyon Paketi')}
                        className="w-full text-center py-2.5 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:shadow-md transition-all cursor-pointer mt-2"
                      >
                        Hemen Premium'a Yükselt
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Core App Preferences and JSON Exporter always preserved at the bottom */}
          <div className="mt-8 pt-6 border-t border-outline/75 space-y-4">
            <h4 className="text-xs uppercase font-serif font-bold text-primary tracking-wide">Yedekleme & Tercihler</h4>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-dim/40 p-4 rounded-xl border border-outline">
              <div className="space-y-0.5">
                <p className="font-bold text-[11px] text-primary uppercase tracking-tight">Verilerimi Cihaza İndir</p>
                <p className="text-[10px] text-on-surface-variant leading-normal">Çözdüğün soruları, sürelerini ve başarı durumunu JSON formatında yedekle.</p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
              >
                <Download size={13} />
                JSON Dışa Aktar
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Subscription Pay checkout Modal Window */}
      {selectedPlanToSubscribe && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-outline rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-outline bg-surface-dim/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-primary animate-bounce" />
                <h3 className="font-serif font-black underline underline-offset-4 text-sm text-primary">Premium Üyelik Ödemesi</h3>
              </div>
              <button 
                onClick={() => setSelectedPlanToSubscribe(null)}
                className="p-1 hover:bg-surface-dim rounded text-on-surface-variant cursor-pointer transition-colors"
                disabled={isPaying}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            {paymentSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
                  <Check size={32} className="animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-serif font-black text-md text-emerald-800">Tebrikler, Şampiyon!</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Ödemeniz başarıyla alındı ve <strong>Premium LGS Şampiyon</strong> aboneliğiniz tanımlandı. Sınırsız AI koçluğunun tadını çıkarın!</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-primary">Seçilen Plan:</span>
                    <span className="font-bold text-primary uppercase font-serif italic">{selectedPlanToSubscribe}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-primary">Aylık Ücret:</span>
                    <span className="font-bold text-primary font-mono bg-white px-2 py-0.5 rounded border border-outline">199.00 ₺</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Card Holder */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-primary block">Kart Sahibinin Adı Soyadı</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Deniz Yılmaz"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full text-xs p-2.5 border border-outline rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    />
                  </div>

                  {/* Card Number */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-primary block">Kart Numarası</label>
                    <input 
                      type="text" 
                      required
                      maxLength={19}
                      placeholder="4355 1200 4567 8900"
                      value={cardNumber}
                      onChange={(e) => {
                        // Very basic card spaces formatting helper
                        const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                        const matches = v.match(/\d{4,16}/g);
                        const match = (matches && matches[0]) || '';
                        const parts = [];
                        for (let i = 0, len = match.length; i < len; i += 4) {
                          parts.push(match.substring(i, i + 4));
                        }
                        if (parts.length > 0) {
                          setCardNumber(parts.join(' '));
                        } else {
                          setCardNumber(v);
                        }
                      }}
                      className="w-full text-xs p-2.5 border border-outline rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-primary font-mono font-medium"
                    />
                  </div>

                  {/* Expiry & CVC Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 font-sans">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-primary block">Son Kullanma (AA/YY)</label>
                      <input 
                        type="text" 
                        required
                        maxLength={5}
                        placeholder="09/28"
                        value={cardExpiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9/]/g, '');
                          if (v.length === 2 && !v.includes('/')) {
                            v = v + '/';
                          }
                          setCardExpiry(v);
                        }}
                        className="w-full text-xs p-2.5 border border-outline rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-primary font-mono font-medium"
                      />
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-primary block">CVC koddur (3 Hane)</label>
                      <input 
                        type="password" 
                        required
                        maxLength={3}
                        placeholder="•••"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full text-xs p-2.5 border border-outline rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-primary font-mono font-medium text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 p-3 rounded-lg border border-outline/50 flex items-start gap-2">
                  <Lock size={12} className="text-primary mt-0.5 shrink-0" />
                  <p className="text-[9px] text-on-surface-variant font-medium leading-normal">Bu ödeme bir simülasyondur. Gerçek kart bilgilerinizi girmek yerine rastgele ödeme bilgileri vererek sisteme premium üyelik kazandırabilirsiniz.</p>
                </div>

                {/* Submitting buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isPaying}
                    className="flex-1 py-3 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:shadow-md disabled:bg-primary/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isPaying ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        Güvenli Bağlanıyor...
                      </>
                    ) : (
                      <>
                        <Check size={13} />
                        Simüle Ödeme Yap
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlanToSubscribe(null)}
                    className="px-4 py-3 border border-outline text-xs font-bold uppercase tracking-wider rounded-xl text-stone-600 hover:bg-stone-50 transition-all cursor-pointer"
                    disabled={isPaying}
                  >
                    Kapat
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
