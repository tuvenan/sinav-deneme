import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function AnalysisView() {
  const topics = [
    { name: 'Üslü Sayılar', score: 85, trend: 'up' },
    { name: 'Kareköklü İfadeler', score: 72, trend: 'up' },
    { name: 'Veri Analizi', score: 94, trend: 'stable' },
    { name: 'Olasılık', score: 65, trend: 'down' },
  ];

  return (
    <div className="p-8 lg:p-12 max-w-4xl mx-auto space-y-10 animate-slide-up">
      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-primary italic">Konu Analizi</h1>
        <p className="text-on-surface-variant">Performansınızı ve akademik gelişiminizi buradan takip edebilirsiniz.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-outline rounded-xl p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-xl">Genel Başarı</h3>
            <PieChart className="text-primary opacity-50" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-serif font-black italic text-primary">%78</span>
            <span className="text-sm font-bold text-emerald-600">+%12 bu hafta</span>
          </div>
        </div>

        <div className="bg-white border border-outline rounded-xl p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-xl">Hedef Tamamlama</h3>
            <BarChart3 className="text-primary opacity-50" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <span>Haftalık Soru Hedefi</span>
              <span>340 / 500</span>
            </div>
            <div className="w-full h-2 bg-surface-dim rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[68%]" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-outline rounded-xl overflow-hidden">
        <div className="p-6 border-b border-outline bg-surface-dim/30">
          <h3 className="font-serif font-bold text-lg">Detaylı Konu Bazlı Analiz</h3>
        </div>
        <div className="divide-y divide-outline">
          {topics.map((topic) => (
            <div key={topic.name} className="p-6 flex items-center justify-between hover:bg-surface-dim/20 transition-colors">
              <span className="font-medium text-primary">{topic.name}</span>
              <div className="flex items-center gap-8">
                <div className="w-32 h-1.5 bg-surface-dim rounded-full overflow-hidden">
                  <div className={`h-full bg-primary`} style={{ width: `${topic.score}%` }} />
                </div>
                <span className="text-sm font-bold w-12 text-right">%{topic.score}</span>
                {topic.trend === 'up' && <TrendingUp size={16} className="text-emerald-500" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
