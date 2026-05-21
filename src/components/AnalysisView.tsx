import { TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import type { SolveHistory } from '../types';

interface AnalysisViewProps {
  solveHistory?: SolveHistory[];
}

export default function AnalysisView({ solveHistory = [] }: AnalysisViewProps) {
  const topics = [
    { name: 'Üslü Sayılar', score: 85, trend: 'up' },
    { name: 'Kareköklü İfadeler', score: 72, trend: 'up' },
    { name: 'Veri Analizi', score: 94, trend: 'stable' },
    { name: 'Olasılık', score: 65, trend: 'down' },
  ];

  const weeklyData = [
    { day: 'Pzt', solved: 45 },
    { day: 'Sal', solved: 52 },
    { day: 'Çar', solved: 38 },
    { day: 'Per', solved: 65 },
    { day: 'Cum', solved: 48 },
    { day: 'Cmt', solved: 72 },
    { day: 'Paz', solved: 20 },
  ];

  const totalSolved = solveHistory.length;
  const correctAnswers = solveHistory.filter(h => h.isCorrect).length;
  
  const accuracyVal = totalSolved > 0 ? Math.round((correctAnswers / totalSolved) * 100) : 78;
  const accuracyText = `%${accuracyVal}`;

  const avgTime = totalSolved > 0 
    ? Math.round(solveHistory.reduce((acc, curr) => acc + curr.timeSpent, 0) / totalSolved) 
    : 54;

  const successData = totalSolved > 0 
    ? [
        { name: 'Doğru', value: correctAnswers, color: '#0f172a' },
        { name: 'Yanlış/Boş', value: totalSolved - correctAnswers, color: '#e2e8f0' }
      ]
    : [
        { name: 'Doğru', value: 78, color: '#0f172a' },
        { name: 'Yanlış', value: 12, color: '#e2e8f0' },
        { name: 'Boş', value: 10, color: '#f1f5f9' },
      ];

  const THEME_COLORS = {
    primary: '#0f172a',
    accent: '#4f46e5',
    outline: '#e2e8f0',
    textVariant: '#475569'
  };

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto space-y-10 animate-slide-up">
      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-primary italic">Konu Analizi</h1>
        <p className="text-on-surface-variant">Performansınızı ve akademik gelişiminizi buradan takip edebilirsiniz.</p>
      </div>

      {/* KPI Metrics Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Questions Solved */}
        <div className="bg-white border border-outline rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">Toplam Soru</p>
            <h4 className="text-3xl font-serif font-black italic text-primary mt-1">{totalSolved || 4}</h4>
          </div>
          <div className="bg-surface-dim p-2.5 rounded-lg border border-outline">
            <TrendingUp size={20} className="text-primary" />
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-white border border-outline rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">Doğruluk Oranı</p>
            <h4 className="text-3xl font-serif font-black italic text-primary mt-1">{accuracyText}</h4>
          </div>
          <div className="bg-surface-dim p-2.5 rounded-lg border border-outline">
            <CheckCircle size={20} className="text-secondary" />
          </div>
        </div>

        {/* Average Time Spent */}
        <div className="bg-white border border-outline rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">Ortalama Süre</p>
            <h4 className="text-3xl font-serif font-black italic text-primary mt-1">{avgTime} sn</h4>
          </div>
          <div className="bg-surface-dim p-2.5 rounded-lg border border-outline">
            <Clock size={20} className="text-primary animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Success Distribution - Pie Chart */}
        <div className="bg-white border border-outline rounded-xl p-8 shadow-sm flex flex-col items-center">
          <h3 className="font-serif font-bold text-xl mb-6 self-start">Genel Başarı Dağılımı</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={successData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={1000}
                >
                  {successData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <span className="text-4xl font-serif font-black italic text-primary">{accuracyText}</span>
            <p className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-widest">Başarı Dağılımı</p>
          </div>
        </div>

        {/* Weekly Activity - Bar Chart */}
        <div className="bg-white border border-outline rounded-xl p-8 shadow-sm">
          <h3 className="font-serif font-bold text-xl mb-6">Haftalık Soru Çözümü</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: THEME_COLORS.textVariant, fontSize: 12, fontWeight: 500 }}
                />
                <YAxis 
                  hide={true} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="solved" 
                  fill={THEME_COLORS.primary} 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            <span>Toplam Soru Hedefi</span>
            <span className="text-primary">340 / 500</span>
          </div>
          <div className="w-full h-2 bg-surface-dim rounded-full overflow-hidden mt-2">
            <div className="h-full bg-primary w-[68%] transition-all duration-1000 ease-out" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-outline rounded-xl overflow-hidden">
        <div className="p-6 border-b border-outline bg-surface-dim/30">
          <h3 className="font-serif font-bold text-lg">Detaylı Konu Bazlı Analiz</h3>
        </div>
        <div className="divide-y divide-outline">
          {topics.map((topic) => (
            <div key={topic.name} className="p-6 flex items-center justify-between hover:bg-surface-dim/20 transition-colors group">
              <span className="font-medium text-primary group-hover:translate-x-1 transition-transform">{topic.name}</span>
              <div className="flex items-center gap-8">
                <div className="w-32 h-1.5 bg-surface-dim rounded-full overflow-hidden">
                  <div className={`h-full bg-primary transition-all duration-1000`} style={{ width: `${topic.score}%` }} />
                </div>
                <span className="text-sm font-bold w-12 text-right font-serif italic text-primary">%{topic.score}</span>
                {topic.trend === 'up' && <TrendingUp size={16} className="text-emerald-500" />}
                {topic.trend === 'down' && <TrendingUp size={16} className="text-rose-500 rotate-180" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
