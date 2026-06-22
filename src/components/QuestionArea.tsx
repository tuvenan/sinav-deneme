import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Lightbulb, 
  RefreshCw, 
  Star, 
  TrendingUp, 
  XCircle, 
  BookOpen, 
  Tag, 
  Layers, 
  Award, 
  SlidersHorizontal 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Question, Difficulty, SolveHistory } from '../types';
import GoogleCalendarWidget from './GoogleCalendarWidget';

interface QuestionAreaProps {
  question: Question;
  questions: Question[];
  syllabus?: { subject: string; unit: string; topic: string }[];
  onNewQuestion: () => void;
  onAnswer: (isCorrect: boolean, timeSpentSeconds: number) => void;
  selectedDifficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  correctStreak: number;
  selectedSubject: string;
  setSelectedSubject: (s: string) => void;
  selectedUnit: string;
  setSelectedUnit: (u: string) => void;
  selectedTopic: string;
  setSelectedTopic: (t: string) => void;
  solveHistory: SolveHistory[];
  onSelectQuestion: (q: Question) => void;
}

export default function QuestionArea({
  question,
  questions,
  syllabus = [],
  onNewQuestion,
  onAnswer,
  selectedDifficulty,
  setDifficulty,
  correctStreak,
  selectedSubject,
  setSelectedSubject,
  selectedUnit,
  setSelectedUnit,
  selectedTopic,
  setSelectedTopic,
  solveHistory,
  onSelectQuestion,
}: QuestionAreaProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showLocalHint, setShowLocalHint] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Reset states on question change
  useEffect(() => {
    setSeconds(0);
    setSelectedIdx(null);
    setIsSubmitted(false);
    setShowLocalHint(false);
    setCountdown(null);
  }, [question?.id]);

  // Handle timer
  useEffect(() => {
    if (isSubmitted || !question) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, question?.id]);

  // Handle auto-advance countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      handleNext();
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = () => {
    if (!question || selectedIdx === null || isSubmitted) return;
    setIsSubmitted(true);
    onAnswer(question.options[selectedIdx].isCorrect, seconds);
    setCountdown(5); // 5 seconds of review time before auto-advance
  };

  const handleNext = () => {
    setSelectedIdx(null);
    setIsSubmitted(false);
    setSeconds(0);
    setShowLocalHint(false);
    setCountdown(null);
    onNewQuestion();
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Extract unique elements for cascade selectors using the dynamic, ordered syllabus
  const subjects = ['Hepsi', ...Array.from(new Set(syllabus.map(s => s.subject).filter(Boolean)))];

  const filteredUnits = Array.from(new Set(
    syllabus
      .filter(s => selectedSubject === 'Hepsi' || s.subject === selectedSubject)
      .map(s => s.unit)
      .filter(Boolean)
  ));
  const units = ['Hepsi', ...filteredUnits];

  const filteredTopics = Array.from(new Set(
    syllabus
      .filter(s => selectedSubject === 'Hepsi' || s.subject === selectedSubject)
      .filter(s => selectedUnit === 'Hepsi' || s.unit === selectedUnit)
      .map(s => s.topic)
      .filter(Boolean)
  ));
  const topics = ['Hepsi', ...filteredTopics];

  // Filter active bank questions based on Ders, Ünite, Konu. limit to 20.
  const activeBankQuestions = questions.filter(q => 
    (selectedSubject === 'Hepsi' || q.subject === selectedSubject) &&
    (selectedUnit === 'Hepsi' || q.unit === selectedUnit) &&
    (selectedTopic === 'Hepsi' || q.topic === selectedTopic)
  ).slice(0, 20);

  // Status counters for the current question bank
  const solvedCount = activeBankQuestions.filter(q => solveHistory.some(h => h.questionId === q.id)).length;
  const correctCount = activeBankQuestions.filter(q => {
    const history = solveHistory.filter(h => h.questionId === q.id);
    return history.length > 0 && history[history.length - 1].isCorrect;
  }).length;
  
  const successRatio = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;
  const progressPercent = activeBankQuestions.length > 0 ? Math.round((solvedCount / activeBankQuestions.length) * 100) : 0;

  const currentOption = (question && selectedIdx !== null) ? question.options[selectedIdx] : null;

  return (
    <section className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-surface-bright">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Dynamic Class, Unit, and Topic Selector Navigation Panel */}
        <div className="bg-white border border-outline rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline pb-3">
            <SlidersHorizontal size={16} className="text-primary" />
            <span className="text-sm font-black uppercase tracking-wider text-primary">Ders, Ünite ve Konu Seçimi</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subject Selector */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/70 block">Ders Seçimi</label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedUnit('Hepsi');
                  setSelectedTopic('Hepsi');
                }}
                className="w-full bg-surface-dim border border-outline rounded-xl p-2.5 text-xs text-primary font-bold focus:outline-none focus:border-primary"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Unit Selector */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/70 block">Ünite Seçimi</label>
              <select
                value={selectedUnit}
                onChange={(e) => {
                  setSelectedUnit(e.target.value);
                  setSelectedTopic('Hepsi');
                }}
                className="w-full bg-surface-dim border border-outline rounded-xl p-2.5 text-xs text-primary font-bold focus:outline-none focus:border-primary"
              >
                {units.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Topic Selector */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/70 block">Konu Seçimi</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-surface-dim border border-outline rounded-xl p-2.5 text-xs text-primary font-semibold focus:outline-none focus:border-primary"
              >
                {topics.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 20-Question Bank Dashboard Bridging Indicator */}
        {activeBankQuestions.length > 0 && (
          <div className="bg-white border border-outline rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in animate-duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline pb-3">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-primary" />
                <span className="text-sm font-black uppercase tracking-wider text-primary">Soru Bankası Test Çözüm Köprüsü</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="text-on-surface-variant">Durum:</span>
                <span className="bg-surface-dim px-2.5 py-1 rounded-md border border-outline text-primary font-black animate-pulse">
                  {solvedCount} / {activeBankQuestions.length} Çözüldü
                </span>
                <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-100 font-bold">
                  Başarı Oranı: %{successRatio}
                </span>
              </div>
            </div>

            {/* Grid display from 1 to 20 */}
            <div className="flex flex-wrap gap-2 justify-start items-center">
              {activeBankQuestions.map((q, idx) => {
                const isCurrent = q.id === question.id;
                const history = solveHistory.filter(h => h.questionId === q.id);
                const isSolved = history.length > 0;
                const isCorrect = isSolved && history[history.length - 1].isCorrect;

                let btnStyle = 'bg-surface-dim text-on-surface-variant border-outline';
                if (isCurrent) {
                  btnStyle = 'bg-primary text-white border-primary shadow-md font-extrabold scale-105 ring-2 ring-primary/20';
                } else if (isSolved) {
                  btnStyle = isCorrect 
                    ? 'bg-emerald-500 text-white border-emerald-600 font-bold' 
                    : 'bg-rose-500 text-white border-rose-600 font-bold';
                }

                return (
                  <div
                    key={q.id}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center text-xs sm:text-sm font-black transition-all select-none ${btnStyle}`}
                    title={`Soru ${idx + 1}`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>

            {/* Micro Progress Track */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/70">
                <span>Konu Tamamlama Oranı</span>
                <span>%{progressPercent}</span>
              </div>
              <div className="w-full bg-surface-dim h-2 rounded-full overflow-hidden border border-outline">
                <div 
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {question ? (
          <>
            {/* Question Card */}
            <div className="bg-white border border-outline rounded-xl p-5 sm:p-10 shadow-sm relative overflow-hidden">
              <AnimatePresence>
                {isSubmitted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 backdrop-blur-[2px]"
                  >
                    <div className={`flex flex-col items-center gap-4 sm:gap-6 p-6 sm:p-10 rounded-xl ${
                      currentOption?.isCorrect ? 'text-secondary' : 'text-error'
                    }`}>
                      {currentOption?.isCorrect ? <CheckCircle size={56} className="text-emerald-600 animate-bounce" /> : <XCircle size={56} className="text-rose-600" />}
                      <span className="text-2xl sm:text-3xl font-serif font-black italic">
                        {currentOption?.isCorrect ? 'Tebrikler, Doğru Cevap!' : 'Yanlış Cevap'}
                      </span>
                      <span className="text-xs sm:text-sm font-sans font-medium text-on-surface-variant text-center max-w-sm">
                        {currentOption?.isCorrect 
                          ? 'Sıradaki soruya geçerek başarını sürdür!' 
                          : (question.errorAnalysis || 'Bu konudaki bilgilerini tazelemek için çözümü incele.')}
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-medium text-on-surface-variant">
                        Çözüm Süresi: {formatTime(seconds)}
                      </span>
                      {countdown !== null && (
                        <div className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 animate-pulse mt-2 flex items-center gap-1.5 font-sans">
                          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                          <span>{countdown} saniye içinde sıradaki soruya geçiliyor...</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col xs:flex-row gap-4 xs:items-center justify-between mb-6 sm:mb-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-surface-dim px-3 py-1 rounded-sm border border-outline text-on-surface-variant">
                    Soru #{question.id}
                  </span>
                  
                  <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 px-3 py-1 rounded-sm border border-indigo-100 flex items-center gap-1">
                    <BookOpen size={10} />
                    {question.subject}
                  </span>

                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-sm border border-emerald-100 flex items-center gap-1">
                    <Layers size={10} />
                    {question.unit}
                  </span>

                  <span className="text-[10px] font-medium bg-amber-50 text-amber-800 px-3 py-1 rounded-sm border border-amber-100 flex items-center gap-1">
                    <Tag size={10} />
                    {question.topic}
                  </span>

                  <div className="flex items-center gap-1.5 bg-surface-dim border border-outline px-3 py-1 rounded-sm text-xs font-mono text-on-surface-variant font-bold">
                    <Clock size={12} className="text-primary" />
                    <span>{formatTime(seconds)}</span>
                  </div>
                </div>

                <div className="flex flex-row xs:flex-col items-center xs:items-end justify-between xs:justify-start gap-1 border-t xs:border-t-0 pt-3 xs:pt-0 border-outline/40">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-primary fill-primary" />
                    <span className="text-xs sm:text-sm font-bold font-serif italic text-primary">Zorluk: {question.difficulty}</span>
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`w-3 h-1 rounded-full transition-colors ${
                          i < correctStreak ? 'bg-primary' : 'bg-outline-variant'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="prose prose-slate max-w-none">
                <h2 className="text-xl sm:text-2xl font-serif text-primary mb-6 sm:mb-8 leading-relaxed font-semibold">
                  {question.text}
                </h2>
                {question.imageUrl && (
                  <div className="mb-6 sm:mb-8 flex flex-col items-center justify-center bg-white border border-outline rounded-xl p-4 shadow-sm overflow-hidden max-w-md mx-auto">
                    <span className="text-[9px] font-black uppercase text-on-surface-variant/60 tracking-wider mb-2">Soru Görseli / İpucu</span>
                    <img
                      src={question.imageUrl}
                      alt={`Soru #${question.id} Görsel İpucu`}
                      className="max-h-[240px] md:max-h-[280px] w-auto object-contain rounded-md"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="bg-surface-dim border-l-4 border-primary p-4 sm:p-6 mb-6 sm:mb-8 italic text-on-surface-variant text-sm sm:text-base">
                  <p className="mb-3 sm:mb-4">{question.context}</p>
                  <p className="font-bold font-sans not-italic text-primary">{question.query}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {question.options.map((option, idx) => (
                  <button
                    key={idx}
                    disabled={isSubmitted}
                    onClick={() => setSelectedIdx(idx)}
                    className={`flex items-center justify-between p-4 sm:p-5 rounded-md border-2 transition-all text-left cursor-pointer ${
                      selectedIdx === idx
                        ? 'border-primary bg-primary/5'
                        : 'border-outline bg-white hover:border-primary/40 hover:bg-surface-dim'
                    } ${
                      isSubmitted && option.isCorrect ? 'border-primary bg-primary/5' : ''
                    } ${
                      isSubmitted && selectedIdx === idx && !option.isCorrect ? 'border-error bg-error/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                       <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md border-2 flex items-center justify-center text-xs sm:text-sm font-bold transition-colors ${
                        selectedIdx === idx ? 'border-primary bg-primary text-white' : 'border-outline text-on-surface-variant'
                      }`}>
                        {option.label}
                      </div>
                      <span className="font-semibold text-primary text-base sm:text-lg">{option.value}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hint Panel */}
            <AnimatePresence>
              {showLocalHint && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-5 shadow-sm space-y-2"
                >
                  <div className="flex items-center gap-2 text-amber-800 font-bold">
                    <Lightbulb size={16} />
                    <span>Ders Çözüm İpucu</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed">
                    {question.hint || 'Bu soru için henüz bir ipucu eklenmemiş.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Bar */}
            <div className="space-y-6">
              <div className="bg-white border border-outline rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-on-surface-variant" />
                  <span className="text-sm font-bold uppercase tracking-tight text-on-surface-variant">Zorluk Seviyesi Filtrele:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {(['Hepsi', 'Kolay', 'Orta', 'Zor'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-3.5 sm:px-6 py-1.5 sm:py-2 rounded-md border text-[10px] sm:text-xs font-bold transition-all uppercase tracking-widest cursor-pointer ${
                        selectedDifficulty === d
                          ? 'bg-primary text-white border-primary shadow-md'
                          : 'bg-white text-on-surface-variant border-outline hover:border-primary hover:text-primary'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col xs:flex-row flex-wrap gap-4 items-center justify-start">
                {!isSubmitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={selectedIdx === null}
                    className="bg-primary text-white px-6 sm:px-10 py-3 sm:py-4 rounded-md font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 w-full xs:w-auto text-center flex justify-center cursor-pointer"
                  >
                    Cevabı Gönder
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="bg-primary text-white px-6 sm:px-10 py-3 sm:py-4 rounded-md font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all w-full xs:w-auto text-center flex justify-center cursor-pointer"
                  >
                    Sıradaki Soru
                  </button>
                )}

                <button
                  onClick={() => setShowLocalHint(prev => !prev)}
                  className="flex items-center justify-center gap-2 bg-white text-primary border-2 border-primary px-5 sm:px-8 py-3 sm:py-4 rounded-md font-bold text-sm shadow-sm hover:bg-primary/5 active:scale-95 transition-all w-full xs:w-auto text-center cursor-pointer"
                >
                  <Lightbulb size={18} />
                  {showLocalHint ? 'İpucunu Gizle' : 'İpucu Göster'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border border-outline rounded-xl p-10 text-center space-y-4">
            <h3 className="text-lg font-serif font-bold text-primary">Seçilen Filtrelere Uygun Soru Bulunamadı</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Ders, ünite veya zorluk filtrelerinize uyan hiçbir soru havuzda mevcut değil. Lütfen daha genel filtreler seçin veya Admin Paneline giderek yeni sorular ekleyin.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedSubject('Hepsi');
                  setSelectedUnit('Hepsi');
                  setSelectedTopic('Hepsi');
                  setDifficulty('Hepsi');
                }}
                className="px-5 py-2.5 bg-primary text-white font-bold rounded-lg text-xs uppercase tracking-wider cursor-pointer"
              >
                Tüm Filtreleri Sıfırla
              </button>
            </div>
          </div>
        )}

        {/* Beautiful Google Calendar Planner Widget */}
        <GoogleCalendarWidget />
      </div>
    </section>
  );
}
