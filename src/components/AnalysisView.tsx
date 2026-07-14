import { useState } from 'react';
import { TrendingUp, Clock, CheckCircle, Star } from 'lucide-react';
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
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import type { SolveHistory, Question } from '../types';
import { LGS_SYLLABUS } from '../utils/questionGenerator';

interface AnalysisViewProps {
  solveHistory?: SolveHistory[];
  questions?: Question[];
  syllabus?: { subject: string; unit: string; topic: string }[];
}

export default function AnalysisView({ 
  solveHistory = [], 
  questions = [], 
  syllabus = [] 
}: AnalysisViewProps) {
  const [aggrLevel, setAggrLevel] = useState<'ders' | 'unite' | 'konu'>('ders');

  // Use provided syllabus or fallback to default
  const activeSyllabus = syllabus && syllabus.length > 0 ? syllabus : LGS_SYLLABUS;

  // Enriched solve history: map questionId to actual question details
  const enrichedHistory = solveHistory.map(hist => {
    const q = questions.find(question => question.id === hist.questionId);
    return {
      ...hist,
      subject: q?.subject || '',
      unit: q?.unit || '',
      topic: q?.topic || '',
    };
  });

  // Calculate radar data based on selected aggrLevel
  let radarData: { name: string; proficiency: number; totalSolved: number; correct: number }[] = [];

  if (aggrLevel === 'ders') {
    const subjects = Array.from(new Set(activeSyllabus.map(s => s.subject).filter(Boolean)));
    radarData = subjects.map(subjectName => {
      const relatedHist = enrichedHistory.filter(h => h.subject === subjectName);
      const total = relatedHist.length;
      const correct = relatedHist.filter(h => h.isCorrect).length;
      const proficiency = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        name: subjectName,
        proficiency,
        totalSolved: total,
        correct,
      };
    });
  } else if (aggrLevel === 'unite') {
    const units = Array.from(new Set(activeSyllabus.map(s => s.unit).filter(Boolean)));
    const unitStats = units.map(unitName => {
      const relatedHist = enrichedHistory.filter(h => h.unit === unitName);
      const total = relatedHist.length;
      const correct = relatedHist.filter(h => h.isCorrect).length;
      const proficiency = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        name: unitName.length > 20 ? unitName.substring(0, 20) + '...' : unitName,
        proficiency,
        totalSolved: total,
        correct,
      };
    });
    // Take the ones with history first, limit to maximum 8 units to keep radar readable
    const sortedUnits = unitStats.sort((a, b) => b.totalSolved - a.totalSolved);
    radarData = sortedUnits.slice(0, 8);
  } else {
    const topicsList = Array.from(new Set(activeSyllabus.map(s => s.topic).filter(Boolean)));
    const topicStats = topicsList.map(topicName => {
      const relatedHist = enrichedHistory.filter(h => h.topic === topicName);
      const total = relatedHist.length;
      const correct = relatedHist.filter(h => h.isCorrect).length;
      const proficiency = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        name: topicName.length > 18 ? topicName.substring(0, 18) + '...' : topicName,
        proficiency,
        totalSolved: total,
        correct,
      };
    });
    // Take the ones with history first, limit to maximum 8 topics to keep radar readable
    const sortedTopics = topicStats.sort((a, b) => b.totalSolved - a.totalSolved);
    radarData = sortedTopics.slice(0, 8);
  }

  // Radar chart needs at least 3 points to draw a polygon properly
  if (radarData.length < 3) {
    const padItems = [
      { name: 'Konu A', proficiency: 0, totalSolved: 0, correct: 0 },
      { name: 'Konu B', proficiency: 0, totalSolved: 0, correct: 0 },
      { name: 'Konu C', proficiency: 0, totalSolved: 0, correct: 0 },
    ];
    radarData = [...radarData, ...padItems].slice(0, 3);
  }

  // Generate study insight highlights
  const solvedWithHistory = radarData.filter(d => d.totalSolved > 0);
  let strongest = '';
  let weakest = '';
  
  if (solvedWithHistory.length > 0) {
    const sortedDesc = [...solvedWithHistory].sort((a, b) => b.proficiency - a.proficiency);
    strongest = sortedDesc[0].name;
    const sortedAsc = [...solvedWithHistory].sort((a, b) => a.proficiency - b.proficiency);
    weakest = sortedAsc[0].name;
  }

  // Calculate dynamic list of topics for bottom table
  const uniqueTopics = Array.from(new Set(activeSyllabus.map(s => s.topic).filter(Boolean)));
  const dynamicTopics = uniqueTopics.map(topicName => {
    const relatedHist = enrichedHistory.filter(h => h.topic === topicName);
    const total = relatedHist.length;
    const correct = relatedHist.filter(h => h.isCorrect).length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    let trend: 'up' | 'stable' | 'down' = 'stable';
    if (total > 0) {
      trend = score >= 70 ? 'up' : score >= 40 ? 'stable' : 'down';
    }

    return {
      name: topicName,
      score,
      total,
      trend
    };
  });

  // Sort: topics with most solved questions first, then high scores
  const displayTopics = dynamicTopics.length > 0 
    ? dynamicTopics.sort((a, b) => b.total - a.total || b.score - a.score)
    : [
        { name: 'Üslü Sayılar', score: 85, trend: 'up', total: 0 },
        { name: 'Kareköklü İfadeler', score: 72, trend: 'up', total: 0 },
        { name: 'Veri Analizi', score: 94, trend: 'stable', total: 0 },
        { name: 'Olasılık', score: 65, trend: 'down', total: 0 },
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
    <div className="p-2 xs:p-4 sm:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-10 animate-slide-up">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary italic">Konu Analizi</h1>
        <p className="text-xs sm:text-sm text-on-surface-variant">Performansınızı ve akademik gelişiminizi buradan takip edebilirsiniz.</p>
      </div>

      {/* KPI Metrics Summary Row */}
      <div className="kpi-grid grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        {/* Total Questions Solved */}
        <div className="bg-white border border-outline rounded-xl p-4 sm:p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">Toplam Soru</p>
            <h4 className="text-2xl sm:text-3xl font-serif font-black italic text-primary mt-1">{totalSolved || 4}</h4>
          </div>
          <div className="bg-surface-dim p-2 rounded-lg border border-outline">
            <TrendingUp size={18} className="text-primary" />
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-white border border-outline rounded-xl p-4 sm:p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">Doğruluk Oranı</p>
            <h4 className="text-2xl sm:text-3xl font-serif font-black italic text-primary mt-1">{accuracyText}</h4>
          </div>
          <div className="bg-surface-dim p-2 rounded-lg border border-outline">
            <CheckCircle size={18} className="text-secondary" />
          </div>
        </div>

        {/* Average Time Spent */}
        <div className="bg-white border border-outline rounded-xl p-4 sm:p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">Ortalama Süre</p>
            <h4 className="text-2xl sm:text-3xl font-serif font-black italic text-primary mt-1">{avgTime} sn</h4>
          </div>
          <div className="bg-surface-dim p-2 rounded-lg border border-outline">
            <Clock size={18} className="text-primary animate-pulse" />
          </div>
        </div>
      </div>

      {/* Radar Chart Card */}
      <div className="radar-grid bg-white border border-outline rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
        {/* Left Side: Header & Explanations */}
        <div className="lg:col-span-5 space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
              Yeterlilik Radarı
            </span>
            <h3 className="font-serif font-bold text-2xl text-primary mt-3">Kazanım & Konu Analizi</h3>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
              Çözdüğünüz soruların ders, ünite ve konu düzeyindeki başarı oranlarına göre akademik yeterlilik haritanız çıkarılmıştır.
            </p>
          </div>

          {/* Aggregation Level Toggles */}
          <div className="flex bg-surface-dim p-1 rounded-lg border border-outline max-w-xs">
            <button
              onClick={() => setAggrLevel('ders')}
              className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${
                aggrLevel === 'ders'
                  ? 'bg-white text-primary shadow-sm border border-outline'
                  : 'text-on-surface-variant/70 hover:text-primary'
              }`}
            >
              Dersler
            </button>
            <button
              onClick={() => setAggrLevel('unite')}
              className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${
                aggrLevel === 'unite'
                  ? 'bg-white text-primary shadow-sm border border-outline'
                  : 'text-on-surface-variant/70 hover:text-primary'
              }`}
            >
              Üniteler
            </button>
            <button
              onClick={() => setAggrLevel('konu')}
              className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${
                aggrLevel === 'konu'
                  ? 'bg-white text-primary shadow-sm border border-outline'
                  : 'text-on-surface-variant/70 hover:text-primary'
              }`}
            >
              Konular
            </button>
          </div>

          {/* Insight panel */}
          <div className="bg-surface-dim/50 border border-outline rounded-lg p-4 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Star size={14} className="text-primary fill-primary/20" />
              Gelişim Özetiniz
            </h5>
            {strongest || weakest ? (
              <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
                {strongest && (
                  <p>
                    <span className="font-bold text-primary">En Başarılı Alan:</span>{' '}
                    <span className="text-indigo-600 font-semibold">{strongest}</span> (%{radarData.find(r => r.name === strongest)?.proficiency || 100} Başarı)
                  </p>
                )}
                {weakest && weakest !== strongest && (
                  <p>
                    <span className="font-bold text-primary">Odaklanılması Gereken:</span>{' '}
                    <span className="text-rose-500 font-semibold">{weakest}</span> (%{radarData.find(r => r.name === weakest)?.proficiency || 0} Başarı). Bu konudaki soru bankalarına ağırlık verebilirsiniz.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Henüz yeterli soru çözümü yapılmadı. Soru çözdükçe bu radar analiz paneli güçlü ve zayıf konularınızı otomatik olarak tespit edecektir.
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Recharts Radar Chart */}
        <div className="lg:col-span-7 h-[285px] xs:h-[320px] lg:h-[340px] flex items-center justify-center relative bg-surface-dim/20 rounded-xl border border-outline/50 p-2 sm:p-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="55%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <PolarAngleAxis 
                dataKey="name" 
                tick={{ fill: THEME_COLORS.textVariant, fontSize: 8.5, fontWeight: 600 }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fill: THEME_COLORS.textVariant, fontSize: 8 }}
                axisLine={false}
              />
              <Radar
                name="Başarı %"
                dataKey="proficiency"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.15}
                animationDuration={1200}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any, name: any, props: any) => {
                  return [
                    `%${value} Başarı Oranı (${props.payload.totalSolved} Soru)`,
                    `Kazanım Durumu`
                  ];
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Success Distribution - Pie Chart */}
        <div className="bg-white border border-outline rounded-xl p-4 sm:p-8 shadow-sm flex flex-col items-center">
          <h3 className="font-serif font-bold text-lg sm:text-xl mb-4 sm:mb-6 self-start">Genel Başarı Dağılımı</h3>
          <div className="w-full h-56 sm:h-64">
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
                <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center">
            <span className="text-3xl sm:text-4xl font-serif font-black italic text-primary">{accuracyText}</span>
            <p className="text-[10px] sm:text-xs font-bold text-emerald-600 mt-0.5 uppercase tracking-widest">Başarı Dağılımı</p>
          </div>
        </div>

        {/* Weekly Activity - Bar Chart */}
        <div className="bg-white border border-outline rounded-xl p-4 sm:p-8 shadow-sm">
          <h3 className="font-serif font-bold text-lg sm:text-xl mb-4 sm:mb-6">Haftalık Soru Çözümü</h3>
          <div className="w-full h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: THEME_COLORS.textVariant, fontSize: 11, fontWeight: 500 }}
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
          <div className="mt-2 flex justify-between items-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            <span>Toplam Soru Hedefi</span>
            <span className="text-primary">340 / 500</span>
          </div>
          <div className="w-full h-2 bg-surface-dim rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-primary w-[68%] transition-all duration-1000 ease-out" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-outline rounded-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-outline bg-surface-dim/30">
          <h3 className="font-serif font-bold text-base sm:text-lg">Detaylı Konu Bazlı Analiz</h3>
        </div>
        <div className="divide-y divide-outline">
          {displayTopics.slice(0, 10).map((topic) => (
            <div key={topic.name} className="p-4 sm:p-6 flex items-center justify-between hover:bg-surface-dim/20 transition-colors group">
              <span className="text-xs sm:text-sm font-medium text-primary group-hover:translate-x-1 transition-transform max-w-[140px] xs:max-w-none truncate">{topic.name}</span>
              <div className="flex items-center gap-2 sm:gap-8">
                <span className="text-[10px] sm:text-xs text-on-surface-variant font-medium shrink-0">
                  {topic.total > 0 ? `${topic.total} soru` : 'Henüz yok'}
                </span>
                <div className="hidden sm:block w-32 h-1.5 bg-surface-dim rounded-full overflow-hidden">
                  <div className={`h-full bg-primary transition-all duration-1000`} style={{ width: `${topic.score}%` }} />
                </div>
                <span className="text-xs sm:text-sm font-bold w-10 sm:w-12 text-right font-serif italic text-primary">%{topic.score}</span>
                {topic.trend === 'up' && <TrendingUp size={15} className="text-emerald-500 shrink-0" />}
                {topic.trend === 'down' && <TrendingUp size={15} className="text-rose-500 rotate-180 shrink-0" />}
                {topic.trend === 'stable' && <div className="w-4 h-4 flex items-center justify-center text-on-surface-variant/50 font-bold text-xs shrink-0">-</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
