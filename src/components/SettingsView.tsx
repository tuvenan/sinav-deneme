import { Bell, CreditCard, Shield, User } from 'lucide-react';

export default function SettingsView() {
  const sections = [
    { title: 'Profil', icon: User, desc: 'Kişisel bilgilerini ve avatarını yönet.' },
    { title: 'Bildirimler', icon: Bell, desc: 'Ders hatırlatıcılarını ve AI güncellemelerini ayarla.' },
    { title: 'Güvenlik', icon: Shield, desc: 'Şifreni ve hesap güvenliğini kontrol et.' },
    { title: 'Plan & Ödeme', icon: CreditCard, desc: 'Mentorluk paketlerini ve aboneliğini gör.' },
  ];

  return (
    <div className="p-8 lg:p-12 max-w-4xl mx-auto space-y-10 animate-slide-up">
      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-primary italic">Ayarlar</h1>
        <p className="text-on-surface-variant">Hesap tercihlerinizi ve uygulama ayarlarınızı buradan yapılandırın.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sections.map((section) => (
          <div key={section.title} className="group bg-white border border-outline rounded-xl p-6 flex items-center justify-between hover:border-primary transition-all cursor-pointer">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-surface-dim rounded-lg flex items-center justify-center text-primary border border-outline group-hover:bg-primary group-hover:text-white transition-colors">
                <section.icon size={24} />
              </div>
              <div>
                <h4 className="font-bold text-primary text-lg font-serif italic">{section.title}</h4>
                <p className="text-sm text-on-surface-variant">{section.desc}</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full border border-outline flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all">
              →
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface-dim/30 border border-outline rounded-xl p-8 space-y-6">
        <h3 className="font-serif font-bold text-xl text-primary underline underline-offset-8">Uygulama Tercihleri</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-bold text-sm text-primary uppercase tracking-tight">Karanlık Mod (Yakında)</p>
              <p className="text-xs text-on-surface-variant">Arayüzü gece çalışmasına uygun hale getir.</p>
            </div>
            <div className="w-12 h-6 bg-outline-variant rounded-full p-1 cursor-not-allowed opacity-50">
              <div className="w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
          <hr className="border-outline" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-bold text-sm text-primary uppercase tracking-tight">Ebeveyn Denetimi</p>
              <p className="text-xs text-on-surface-variant">Haftalık ilerleme raporlarını e-posta ile gönder.</p>
            </div>
            <div className="w-12 h-6 bg-emerald-500 rounded-full p-1 cursor-pointer flex justify-end">
              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
