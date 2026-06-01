import { CheckCircle, Clock, Lightbulb, RefreshCw, Star, TrendingUp, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import type { Question, Difficulty } from '../types';
import GoogleCalendarWidget from './GoogleCalendarWidget';

interface QuestionAreaProps {
  question: Question;
  onNewQuestion: () => void;
  onAnswer: (isCorrect: boolean, timeSpentSeconds: number) => void;
  onHint: () => void;
  selectedDifficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  correctStreak: number;
}

export default function QuestionArea({
  question,
  onNewQuestion,
  onAnswer,
  onHint,
  selectedDifficulty,
  setDifficulty,
  correctStreak,
}: QuestionAreaProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
    setSelectedIdx(null);
    setIsSubmitted(false);
  }, [question.id]);

  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, question.id]);

  const handleSubmit = () => {
    if (selectedIdx === null || isSubmitted) return;
    setIsSubmitted(true);
    onAnswer(question.options[selectedIdx].isCorrect, seconds);
  };

  const handleNext = () => {
    setSelectedIdx(null);
    setIsSubmitted(false);
    setSeconds(0);
    onNewQuestion();
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentOption = selectedIdx !== null ? question.options[selectedIdx] : null;

  return (
    <section className="flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto bg-surface">
      <div className="max-w-3xl mx-auto">
        <nav className="flex items-center gap-2 mb-6 sm:mb-10 text-xs font-bold uppercase tracking-widest text-on-surface-variant/50">
          <span>Matematik</span>
          <span className="opacity-30">/</span>
          <span className="text-primary">Üslü Sayılar</span>
        </nav>

        {/* Question Card */}
        <div className="bg-white border border-outline rounded-xl p-5 sm:p-10 mb-6 sm:mb-8 shadow-sm relative overflow-hidden">
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
                  {currentOption?.isCorrect ? <CheckCircle size={56} /> : <XCircle size={56} />}
                  <span className="text-2xl sm:text-3xl font-serif font-black italic">
                    {currentOption?.isCorrect ? 'Doğru Cevap' : 'Yanlış Cevap'}
                  </span>
                  <span className="text-xs sm:text-sm font-sans font-medium text-on-surface-variant">
                    Süre: {formatTime(seconds)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col xs:flex-row gap-4 xs:items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest bg-surface-dim px-3 py-1 rounded-sm border border-outline text-on-surface-variant">
                Soru #{question.id}
              </span>
              <div className="flex items-center gap-1.5 bg-surface-dim border border-outline px-3 py-1 rounded-sm text-xs font-mono text-on-surface-variant font-bold">
                <Clock size={12} className="text-primary" />
                <span>{formatTime(seconds)}</span>
              </div>
            </div>
            <div className="flex flex-row xs:flex-col items-center xs:items-end justify-between xs:justify-start gap-1 w-full xs:w-auto border-t xs:border-t-0 pt-3 xs:pt-0 border-outline/40">
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
            <h2 className="text-xl sm:text-2xl font-serif text-primary mb-6 sm:mb-8 leading-relaxed">
              {question.text}
            </h2>
            {question.imageUrl && (
              <div className="mb-6 sm:mb-8 flex flex-col items-center justify-center bg-white border border-outline rounded-xl p-4 shadow-inner-sm overflow-hidden max-w-md mx-auto">
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
                className={`flex items-center justify-between p-4 sm:p-5 rounded-md border-2 transition-all text-left ${
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
                  <span className="font-medium text-primary text-base sm:text-lg">{option.value}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="space-y-6">
          <div className="bg-white border border-outline rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-on-surface-variant" />
              <span className="text-sm font-bold uppercase tracking-tight text-on-surface-variant">Zorluk Seviyesi:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {(['Hepsi', 'Kolay', 'Orta', 'Zor'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3.5 sm:px-6 py-1.5 sm:py-2 rounded-md border text-[10px] sm:text-xs font-bold transition-all uppercase tracking-widest ${
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

          <div className="flex flex-col xs:flex-row flex-wrap gap-4 items-center">
            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={selectedIdx === null}
                className="bg-primary text-white px-6 sm:px-10 py-3 sm:py-4 rounded-md font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 w-full xs:w-auto text-center flex justify-center"
              >
                Cevabı Gönder
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-primary text-white px-6 sm:px-10 py-3 sm:py-4 rounded-md font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all w-full xs:w-auto text-center flex justify-center"
              >
                Sıradaki Soru
              </button>
            )}

            <button
              onClick={onHint}
              className="flex items-center justify-center gap-2 bg-white text-primary border-2 border-primary px-5 sm:px-8 py-3 sm:py-4 rounded-md font-bold text-sm shadow-sm hover:bg-primary/5 active:scale-95 transition-all w-full xs:w-auto text-center"
            >
              <Lightbulb size={18} />
              İpucu İste
            </button>

            <button
              onClick={handleNext}
              className="flex items-center justify-center gap-2 bg-white text-on-surface-variant border-2 border-outline px-5 sm:px-8 py-3 sm:py-4 rounded-md font-bold text-sm hover:bg-surface-dim active:scale-95 transition-all w-full xs:w-auto text-center"
            >
              <RefreshCw size={18} />
              Soru Değiştir
            </button>
          </div>
        </div>

        {/* Beautiful Google Calendar Planner Widget */}
        <GoogleCalendarWidget />
      </div>
    </section>
  );
}
