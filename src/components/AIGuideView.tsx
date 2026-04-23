import { Bot, Lightbulb, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function AIGuideView() {
  const capabilities = [
    { title: 'Anlık Soru Çözümü', icon: Zap, desc: 'Takıldığın her adımda yanındayım.' },
    { title: 'Stratejik İpuçları', icon: Lightbulb, desc: 'Cevabı söylemem, bulmanı sağlarım.' },
    { title: 'Hata Analizi', icon: Bot, desc: 'Neden yanlış yaptığını fark etmene odaklanırım.' },
    { title: 'Kişisel Rehberlik', icon: Sparkles, desc: 'Sana özel çalışma programı öneririm.' },
  ];

  return (
    <div className="p-8 lg:p-12 max-w-4xl mx-auto space-y-12 animate-slide-up">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4">
          <Bot size={14} />
          Yapay Zeka Mentorun
        </div>
        <h1 className="text-4xl lg:text-6xl font-serif font-black text-primary italic leading-tight">
          Sana Nasıl Yardımcı Olabilirim?
        </h1>
        <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">
          LGS yolculuğunda her soru bir basamak. Ben senin bu basamakları sağlam çıkmanı sağlayan kişisel antrenörünüm.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {capabilities.map((cap, i) => (
          <motion.div
            key={cap.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-outline rounded-xl p-8 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-primary/10 hover:border-b-primary"
          >
            <div className="w-12 h-12 bg-surface-dim rounded-md flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <cap.icon size={24} />
            </div>
            <h3 className="font-serif font-bold text-xl text-primary underline underline-offset-4 decoration-primary/20 group-hover:decoration-primary transition-all">
              {cap.title}
            </h3>
            <p className="text-on-surface-variant mt-3 leading-relaxed">
              {cap.desc}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="bg-primary text-white rounded-xl p-10 flex flex-col items-center text-center space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
        <MessageSquare size={48} className="opacity-50" />
        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl font-serif italic font-bold">Özel Bir sorun mu var?</h2>
          <p className="text-white/70">Matematik konuları veya LGS hazırlık süreci hakkında her şeyi sorabilirsin.</p>
        </div>
        <button className="bg-white text-primary px-10 py-4 rounded-md font-bold hover:bg-surface-dim transition-colors relative z-10 shadow-lg">
          Sohbeti Başlat
        </button>
      </div>
    </div>
  );
}
