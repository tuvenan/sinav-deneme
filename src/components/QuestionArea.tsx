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
  SlidersHorizontal,
  Sparkles
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
  isFocusMode: boolean;
  setIsFocusMode: (f: boolean) => void;
  onFocusStateChange?: (isSolving: boolean) => void;
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
  isFocusMode,
  setIsFocusMode,
  onFocusStateChange,
}: QuestionAreaProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showLocalHint, setShowLocalHint] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(() => window.innerWidth >= 768);
  const [isBankOpen, setIsBankOpen] = useState(() => window.innerWidth >= 768);

  // Notify parent of solving state for Focus Mode
  useEffect(() => {
    if (onFocusStateChange) {
      onFocusStateChange(!isSubmitted);
    }
    return () => {
      if (onFocusStateChange) {
        onFocusStateChange(false);
      }
    };
  }, [isSubmitted, onFocusStateChange]);

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
    <section className="flex-1 p-1 xs:px-1.5 xs:py-3 sm:p-6 bg-surface-bright overflow-visible">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Collapsible Panel Toggle Header for Space Optimization on Mobile */}
        <div className="flex flex-row flex-wrap sm:grid sm:grid-cols-3 gap-2 sm:gap-3">
          {/* Filters Toggle Button */}
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`flex-1 min-w-[120px] bg-white border rounded-xl p-2.5 sm:p-4 flex items-center justify-between text-[11px] sm:text-xs font-black transition-all cursor-pointer shadow-sm ${
              isFiltersOpen ? 'border-primary ring-1 ring-primary/10' : 'border-outline hover:border-primary/40'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <SlidersHorizontal size={14} className="text-primary shrink-0" />
              <span className="truncate">Filtreler</span>
            </div>
            <span className="text-[10px] font-bold text-neutral-400 font-mono">
              {isFiltersOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Soru Bankası Toggle Button */}
          {activeBankQuestions.length > 0 && (
            <button
              onClick={() => setIsBankOpen(!isBankOpen)}
              className={`flex-1 min-w-[120px] bg-white border rounded-xl p-2.5 sm:p-4 flex items-center justify-between text-[11px] sm:text-xs font-black transition-all cursor-pointer shadow-sm ${
                isBankOpen ? 'border-primary ring-1 ring-primary/10' : 'border-outline hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                <Award size={14} className="text-primary shrink-0" />
                <span className="truncate">Soru Köprüsü ({solvedCount}/{activeBankQuestions.length})</span>
              </div>
              <span className="text-[10px] font-bold text-neutral-400 font-mono">
                {isBankOpen ? '▲' : '▼'}
              </span>
            </button>
          )}

          {/* Odak Modu Toggle Button */}
          <button
            onClick={() => {
              setIsFocusMode(!isFocusMode);
              if ('vibrate' in navigator) navigator.vibrate([15]);
            }}
            className={`flex-1 min-w-[120px] bg-white border rounded-xl p-2.5 sm:p-4 flex items-center justify-between text-[11px] sm:text-xs font-black transition-all cursor-pointer shadow-sm ${
              isFocusMode ? 'border-indigo-500 bg-indigo-50/10 ring-1 ring-indigo-500/10' : 'border-outline hover:border-indigo-500/40'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <div className="relative flex items-center justify-center">
                <span className={`absolute w-1.5 h-1.5 rounded-full bg-indigo-600 ${isFocusMode ? 'animate-ping' : 'hidden'}`} />
                <span className={`w-1.5 h-1.5 rounded-full bg-indigo-600 ${isFocusMode ? '' : 'bg-neutral-300'}`} />
              </div>
              <span className={`truncate ${isFocusMode ? 'text-indigo-900' : 'text-neutral-500'}`}>Odak Modu</span>
            </div>
            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded font-mono ${isFocusMode ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
              {isFocusMode ? 'Açık' : 'Kapalı'}
            </span>
          </button>
        </div>

        {/* Dynamic Class, Unit, and Topic Selector Navigation Panel */}
        <AnimatePresence initial={false}>
          {isFiltersOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-outline rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 border-b border-outline pb-3">
                <SlidersHorizontal size={16} className="text-primary" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-primary">Ders, Ünite ve Konu Seçimi</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    className="w-full bg-surface-dim border border-outline rounded-xl p-2 sm:p-2.5 text-xs text-primary font-bold focus:outline-none focus:border-primary"
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
                    className="w-full bg-surface-dim border border-outline rounded-xl p-2 sm:p-2.5 text-xs text-primary font-bold focus:outline-none focus:border-primary"
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
                    className="w-full bg-surface-dim border border-outline rounded-xl p-2 sm:p-2.5 text-xs text-primary font-semibold focus:outline-none focus:border-primary"
                  >
                    {topics.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 20-Question Bank Dashboard Bridging Indicator (Static Visual Items) */}
        <AnimatePresence initial={false}>
          {isBankOpen && activeBankQuestions.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-outline rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm space-y-3 sm:space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 border-b border-outline pb-2 sm:pb-3">
                <div className="flex items-center gap-1.5">
                  <Award size={15} className="text-primary sm:w-[18px] sm:h-[18px]" />
                  <span className="text-[10px] sm:text-sm font-black uppercase tracking-wider text-primary">Soru Köprüsü</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-xs font-semibold">
                  <span className="bg-surface-dim px-1.5 py-0.5 rounded border border-outline text-primary font-black animate-pulse">
                    {solvedCount}/{activeBankQuestions.length} Çözüldü
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-100 font-bold">
                    %{successRatio} Başarı
                  </span>
                </div>
              </div>

              {/* Grid display from 1 to 20 as Static visual items to prevent manual jumping */}
              <div className="flex flex-row flex-nowrap justify-between items-center py-1 w-full gap-[2px] xs:gap-[3px] sm:gap-1 md:gap-1 lg:gap-1.5">
                {activeBankQuestions.map((q, idx) => {
                  const isCurrent = q.id === question.id;
                  const history = solveHistory.filter(h => h.questionId === q.id);
                  const isSolved = history.length > 0;
                  const isCorrect = isSolved && history[history.length - 1].isCorrect;

                  let btnStyle = 'bg-surface-dim text-on-surface-variant border-outline';
                  if (isCurrent) {
                    btnStyle = 'bg-primary text-white border-primary shadow-xs font-extrabold scale-105 ring-1 sm:ring-2 ring-primary/20';
                  } else if (isSolved) {
                    btnStyle = isCorrect 
                      ? 'bg-emerald-500 text-white border-emerald-600 font-bold' 
                      : 'bg-rose-500 text-white border-rose-600 font-bold';
                  }

                  return (
                    <div
                      key={q.id}
                      className={`w-[14px] h-[14px] xs:w-[15px] xs:h-[15px] sm:w-[16px] sm:h-[16px] md:w-[30px] md:h-[30px] lg:w-[34px] lg:h-[34px] xl:w-9 xl:h-9 rounded-[3px] xs:rounded-md sm:rounded-md lg:rounded-xl border flex items-center justify-center text-[8px] xs:text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs xl:text-xs font-black select-none transition-all shrink-0 ${btnStyle}`}
                      title={isCurrent ? "Şu anki soru" : isSolved ? (isCorrect ? "Doğru çözüldü" : "Yanlış çözüldü") : "Henüz çözülmedi"}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>

              {/* Micro Progress Track */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] sm:text-[10px] uppercase font-bold tracking-wider text-on-surface-variant/70">
                  <span>Konu Tamamlama Oranı</span>
                  <span>%{progressPercent}</span>
                </div>
                <div className="w-full bg-surface-dim h-1 rounded-full overflow-hidden border border-outline">
                  <div 
                    className="bg-primary h-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>



        {question ? (
          <>
            {/* Question Card */}
            <div className="bg-white border border-outline rounded-xl p-4 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
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
                      {!currentOption?.isCorrect && (
                        <div className="bg-indigo-50 border border-indigo-100 p-3 sm:p-4 rounded-xl flex items-start gap-2.5 max-w-sm mt-1 shadow-xs text-left">
                          <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="text-[10px] font-black uppercase text-indigo-700 block tracking-wide">Yapay Zeka Mentor Tavsiyesi</span>
                            <p className="text-[11px] text-indigo-950 leading-relaxed font-semibold">
                              Bu yanlış yaptığın soru türü için sana özel hazırlanan <strong>adım adım çözüm yolları ve taktikleri</strong> "AI Mentor" sayfasında otomatik olarak hazırlandı!
                            </p>
                          </div>
                        </div>
                      )}
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
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-surface-dim px-3 py-1 rounded-sm border border-outline text-on-surface-variant">
                    Soru #{question.id}
                  </span>
                  
                  <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 px-3 py-1 rounded-sm border border-indigo-100 flex items-center gap-1">
                    <BookOpen size={10} />
                    {question.subject}
                  </span>

                  <span className="hidden xs:flex text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-sm border border-emerald-100 items-center gap-1">
                    <Layers size={10} />
                    {question.unit}
                  </span>

                  <span className="hidden sm:flex text-[10px] font-medium bg-amber-50 text-amber-800 px-3 py-1 rounded-sm border border-amber-100 items-center gap-1">
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
                <h2 className="text-base sm:text-xl md:text-2xl font-serif text-primary mb-4 sm:mb-8 leading-relaxed font-semibold">
                  {question.text}
                </h2>
                {question.imageUrl && (
                  <div className="mb-4 sm:mb-8 flex flex-col items-center justify-center bg-white border border-outline rounded-xl p-4 shadow-sm overflow-hidden max-w-md mx-auto">
                    <span className="text-[9px] font-black uppercase text-on-surface-variant/60 tracking-wider mb-2">Soru Görseli / İpucu</span>
                    <img
                      src={question.imageUrl}
                      alt={`Soru #${question.id} Görsel İpucu`}
                      className="max-h-[200px] md:max-h-[280px] w-auto object-contain rounded-md"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="bg-surface-dim border-l-4 border-primary p-3 xs:p-4 sm:p-6 mb-4 sm:mb-8 italic text-on-surface-variant text-xs sm:text-sm md:text-base">
                  <p className="mb-2 sm:mb-4">{question.context}</p>
                  <p className="font-bold font-sans not-italic text-primary">{question.query}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:gap-4">
                {question.options.map((option, idx) => (
                  <button
                    key={idx}
                    disabled={isSubmitted}
                    onClick={() => setSelectedIdx(idx)}
                    className={`flex items-center justify-between p-3 xs:p-4 sm:p-5 rounded-md border-2 transition-all text-left cursor-pointer ${
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
                      <span className="font-semibold text-primary text-xs sm:text-base md:text-lg">{option.value}</span>
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
