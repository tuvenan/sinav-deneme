import { Bot, MoreVertical, Send, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRef, useEffect } from 'react';
import type { Message, Question } from '../types';

interface AITutorProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  progress: number;
  errorAnalysis?: { type: string; suggestion: string };
}

export default function AITutor({ messages, onSendMessage, progress, errorAnalysis }: AITutorProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = inputRef.current?.value.trim();
    if (text) {
      onSendMessage(text);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <section className="w-full md:w-[420px] bg-white flex flex-col border-l border-outline shadow-[-10px_0_30px_rgba(0,0,0,0.02)] fixed right-0 top-16 bottom-0 z-40">
      {/* AI Header */}
      <div className="p-4 border-b border-outline flex items-center justify-between bg-surface-dim/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary text-white flex items-center justify-center shadow-sm">
            <Bot size={20} fill="currentColor" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-serif text-primary">Gemini 3.5 Flash</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest px-1">Aktif Mentor</span>
            </div>
          </div>
        </div>
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* AI Chat Canvas */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth bg-surface-bright">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}
            >
              <div className={`max-w-[90%] p-5 rounded-md border text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-surface-dim text-primary border-outline'
                  : msg.isHint
                  ? 'bg-primary/5 border-primary/20 text-primary italic font-serif'
                  : 'bg-white border-outline text-on-surface'
              }`}>
                <p className="font-medium tracking-tight whitespace-pre-wrap">{msg.text}</p>
              </div>
              <span className="text-[10px] text-on-surface-variant/40 font-black italic uppercase px-2">{msg.timestamp}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Error Analysis Panel */}
      {errorAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 border-t border-outline bg-error/5"
        >
          <div className="flex items-start gap-4 p-5 bg-white rounded-md border border-error/20 shadow-sm">
            <div className="bg-error/10 p-2 rounded-md">
              <ShieldAlert size={20} className="text-error" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-error uppercase tracking-[0.2em]">Kritik Analiz</h4>
              <p className="text-sm text-primary mt-1 font-bold font-serif italic">{errorAnalysis.type}</p>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{errorAnalysis.suggestion}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Chat Footer: Progress */}
      <div className="px-6 pb-4 mt-4">
        <div className="p-5 bg-surface-dim border border-outline rounded-md">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Akademik İlerleme</span>
            <span className="text-xs font-bold text-primary font-serif italic">{progress}%</span>
          </div>
          <div className="w-full h-1 bg-outline-variant rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>
      </div>

      {/* AI Input Box */}
      <div className="p-6 border-t border-outline bg-white">
        <div className="relative">
          <textarea
            ref={inputRef}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Analiz veya ipucu isteyin..."
            className="w-full bg-surface-dim border border-outline rounded-md p-4 pr-14 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none transition-all placeholder:text-on-surface-variant/40 text-primary font-medium"
          />
          <button
            onClick={handleSend}
            className="absolute right-3 bottom-3 w-10 h-10 bg-primary text-white rounded-md flex items-center justify-center shadow-md hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
