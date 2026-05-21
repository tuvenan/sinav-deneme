import { Bot, MoreVertical, Send, ShieldAlert, Mic, MicOff, Square, Trash2, HelpCircle, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRef, useEffect, useState } from 'react';
import type { Message } from '../types';

interface AITutorProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  progress: number;
  errorAnalysis?: { type: string; suggestion: string };
}

export default function AITutor({ messages, onSendMessage, progress, errorAnalysis }: AITutorProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Voice recording & transcription states
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micPermissionError, setMicPermissionError] = useState(false);
  const [simulatedVoiceMode, setSimulatedVoiceMode] = useState(false);

  // Audio nodes refs for visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any | null>(null);

  // Auto-scroll chat canvas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle ticking secondary timers
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 45) {
            // Autostop recording at 45 seconds to keep it short and friendly
            stopRecordingAndAnalyze();
            return 45;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleSend = () => {
    const text = inputRef.current?.value.trim();
    if (text) {
      onSendMessage(text);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  // --- Real-time Microphone Waveform Visualizer ---
  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicPermissionError(false);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; // Low fftSize for responsive, fat visual bars
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;

      const draw = () => {
        if (!isRecording) return;
        animationFrameRef.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgba(255, 255, 255, 1)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.6;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] * 0.45;

          // Gradient color transition from red/orange to deep primary
          const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#e11d48'); // rose-600
          gradient.addColorStop(0.5, '#f43f5e'); // rose-500
          gradient.addColorStop(1, '#ffedd5'); // orange-100

          canvasCtx.fillStyle = gradient;
          
          // Draw symmetric rounded blocks
          const roundedHeight = Math.max(4, barHeight);
          const yPos = (canvas.height - roundedHeight) / 2;
          
          canvasCtx.beginPath();
          canvasCtx.roundRect(x, yPos, barWidth - 2, roundedHeight, 2);
          canvasCtx.fill();

          x += barWidth;
        }
      };

      draw();
    } catch (err) {
      console.warn('Microphone access denied or browser block:', err);
      setMicPermissionError(true);
      // Fallback: draw synthetic idle waves
      drawSyntheticWaves();
    }
  };

  const drawSyntheticWaves = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    let phase = 0;
    const drawMock = () => {
      if (!isRecording) return;
      animationFrameRef.current = requestAnimationFrame(drawMock);
      phase += 0.2;

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.fillStyle = 'rgba(255, 255, 255, 1)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / 16);
      let x = 0;

      for (let i = 0; i < 16; i++) {
        // Generate nice sinus movement
        const wave = Math.sin(phase + i * 0.5) * 18 + 20;
        const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#e11d48');
        gradient.addColorStop(1, '#fda4af');

        canvasCtx.fillStyle = gradient;
        const yPos = (canvas.height - wave) / 2;
        
        canvasCtx.beginPath();
        canvasCtx.roundRect(x, yPos, barWidth - 3, wave, 2);
        canvasCtx.fill();
        x += barWidth;
      }
    };
    drawMock();
  };

  // --- Real-time Speech-to-Text Initialization (Web Speech API with Google cloud context inside Chrome) ---
  const startSpeechRecognition = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'tr-TR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        if (finalText) {
          setTranscript((prev) => prev + ' ' + finalText);
        }
        setInterimTranscript(interimText);
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          setMicPermissionError(true);
        }
      };

      recognition.onend = () => {
        // Handled closed stream
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to boot speech recognition engine:', err);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setTranscript('');
    setInterimTranscript('');
    setMicPermissionError(false);
    setSimulatedVoiceMode(false);

    // Boot visuals and listener
    startAudioVisualizer();
    startSpeechRecognition();
  };

  const stopActiveStream = () => {
    // Stop recording and close sound components
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
  };

  const cancelRecording = () => {
    stopActiveStream();
    setIsRecording(false);
    setTranscript('');
    setInterimTranscript('');
  };

  const stopRecordingAndAnalyze = () => {
    stopActiveStream();
    setIsRecording(false);

    // Build finalized combination
    const finalExpt = `${transcript.trim()} ${interimTranscript.trim()}`.trim();

    if (finalExpt.length === 0) {
      alert('Herhangi bir konuşma tespit edilemedi. Lütfen mikrofona konuşun veya "Demo Konuşma" kısımlarını deneyin.');
      return;
    }

    // Submit voice concept analysis to the AI tutor
    submitVoiceConcept(finalExpt);
  };

  const submitVoiceConcept = (conceptText: string) => {
    const formattedPrompt = `🎙️ [Zor Kavram Açıklama Analizi]\n\nSevgili Mentor, zorlandığım şu konuyu kendi kelimelerimle açıklamak istedim. Lütfen ses kaydı transkriptimi oku ve yaptığım açıklamayı derin analiz ederek eksiklerimi doğrula ve düzelt:\n\n"${conceptText}"`;
    onSendMessage(formattedPrompt);
    setTranscript('');
    setInterimTranscript('');
  };

  // --- Dynamic Simulation / Demo Scenarios for restricted IFrame sandboxes ---
  const handleSimulateScenario = (text: string) => {
    setSimulatedVoiceMode(true);
    setTranscript('');
    setInterimTranscript('');

    // Simulate typing the transcript step by step to mimic authentic Speech Recognition
    let currentIdx = 0;
    const words = text.split(' ');
    
    const interval = setInterval(() => {
      if (currentIdx >= words.length) {
        clearInterval(interval);
        return;
      }
      const nextWord = words[currentIdx];
      setTranscript((prev) => `${prev} ${nextWord}`.trim());
      currentIdx++;
    }, 150);
  };

  const SCENARIOS = [
    {
      label: 'Üsleri Çarpmak (Misconception!)',
      text: 'Hocam üslü sayılarda çarpma işlemi yaparken tabanlar aynı olduğunda bence üsleri kendi arasında çarpmamız gerekiyor mesela iki üzeri üçle iki üzeri beşi çarpınca iki üzeri on beş olur.'
    },
    {
      label: 'Kökleri Toplamak (Misconception!)',
      text: 'Köklü sayılarda toplama yaparken kök içlerindeki sayıları toplayabiliriz herhalde yani kök üç artı kök beş bence kök sekiz yapar.'
    },
    {
      label: 'EBOB EKOK Karışıklığı',
      text: 'Zorlandığım konu EBOB ve EKOK farkı. Eğer böyle küçük parçaları bir araya getirip büyük bir bina inşa edeceksek burada sanırım EBOB formülü kullanmam lazım.'
    }
  ];

  return (
    <section className="w-full md:w-[420px] bg-white flex flex-col border-l border-outline shadow-[-10px_0_30px_rgba(0,0,0,0.02)] fixed right-0 top-16 bottom-0 z-40">
      {/* AI Header */}
      <div className="p-4 border-b border-outline flex items-center justify-between bg-surface-dim/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary text-white flex items-center justify-center shadow-sm">
            <Bot size={20} fill="currentColor" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-serif text-primary flex items-center gap-1">
              <span>LGS Sözel Mentor</span>
              <Sparkles size={11} className="text-amber-500 animate-bounce" />
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest px-1">Ses Analiz Kapsülü Aktif</span>
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
          {messages.map((msg) => {
            const isVoicePrompt = msg.text.includes('[Zor Kavram Açıklama Analizi]');
            let cleanedText = msg.text;
            if (isVoicePrompt) {
              // Beautify display text for user voice prompt
              const match = msg.text.match(/"([^"]+)"/);
              cleanedText = match ? `🎙️ Ses Kaydı Analiz İsteği:\n\n"${match[1]}"` : msg.text;
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}
              >
                <div className={`max-w-[90%] p-5 rounded-md border text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? isVoicePrompt
                      ? 'bg-rose-50/70 text-rose-900 border-rose-200 shadow-sm'
                      : 'bg-surface-dim text-primary border-outline'
                    : msg.isHint
                    ? 'bg-primary/5 border-primary/20 text-primary italic font-serif'
                    : 'bg-white border-outline text-on-surface'
                }`}>
                  <p className="font-medium tracking-tight whitespace-pre-wrap">{cleanedText}</p>
                </div>
                <span className="text-[10px] text-on-surface-variant/40 font-black italic uppercase px-2">{msg.timestamp}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Error Analysis Panel */}
      {errorAnalysis && !isRecording && (
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
              <h4 className="text-[10px] font-black text-error uppercase tracking-[0.2em]">Kritik Hata Analizi</h4>
              <p className="text-sm text-primary mt-1 font-bold font-serif italic">{errorAnalysis.type}</p>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{errorAnalysis.suggestion}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Dynamic Voice Recording Dashboard Panel */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="p-5 border-t border-outline bg-gradient-to-b from-rose-50/50 to-white space-y-4"
          >
            {/* Visualizer header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                </span>
                <span className="text-xs font-bold font-mono text-rose-700">SESİNİZİ KAYDEDİN</span>
              </div>
              <span className="text-xs font-bold font-mono text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                00:{recordingSeconds.toString().padStart(2, '0')} / 00:45
              </span>
            </div>

            {/* Glowing Canvas Wave Block */}
            <div className="relative h-14 bg-white border border-rose-100/60 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
              <canvas ref={canvasRef} width={280} height={56} className="w-full h-full block" />
              {micPermissionError && (
                <div className="absolute inset-0 bg-amber-50/90 flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-tight block">Tarayıcı Mikrofon Blokajı</span>
                  <span className="text-[9px] text-amber-700 leading-tight block">Sandbox iframe veya tarayıcı izni kapalı. Sintetik dalga devrede!</span>
                </div>
              )}
            </div>

            {/* Simulated Concept Quick Fillers (Highly adaptive for sandbox previews!) */}
            <div className="space-y-1.5 bg-white p-3 rounded-lg border border-neutral-150">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1 leading-none">
                <Sparkles size={10} className="text-rose-500" />
                <span>Veya Anında Konuşma Girişi Simüle Edin:</span>
              </span>
              <div className="flex flex-col gap-1 pt-1">
                {SCENARIOS.map((sc, scIdx) => (
                  <button
                    key={scIdx}
                    type="button"
                    onClick={() => handleSimulateScenario(sc.text)}
                    className="text-left font-sans text-[10px] text-neutral-600 hover:text-rose-700 hover:bg-rose-50/50 p-1.5 rounded border border-neutral-100 font-semibold truncate leading-none cursor-pointer"
                  >
                    💬 {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transcription Feed Container */}
            <div className="p-3 bg-neutral-900 text-neutral-100 rounded-xl min-h-[64px] max-h-[100px] overflow-y-auto text-xs leading-relaxed font-semibold">
              {transcript || interimTranscript ? (
                <>
                  <span className="text-emerald-400 font-bold block text-[10px] font-mono tracking-wider mb-1 uppercase">Google STT Canlı Dönüştürücü:</span>
                  <p className="font-mono text-white text-[11px]">
                    {transcript}
                    <span className="text-white/60 italic"> {interimTranscript}</span>
                  </p>
                </>
              ) : (
                <span className="text-neutral-400 block text-center align-middle pt-2 italic">
                  Konuşmaya başlayın... Yapay zeka sesinizi anında yazıya dökecektir.
                </span>
              )}
            </div>

            {/* Recorder Controllers */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={cancelRecording}
                className="px-4 py-2 border border-outline bg-white hover:bg-neutral-50 text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-on-surface"
              >
                <Trash2 size={13} />
                <span>Vazgeç</span>
              </button>
              <button
                onClick={stopRecordingAndAnalyze}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Square size={13} fill="currentColor" />
                <span>Analiz Et</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Footer: Intellectual Academic Progress */}
      {!isRecording && (
        <div className="px-6 pb-2 mt-4">
          <div className="p-4 bg-surface-dim border border-outline rounded-md">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Akademik İlerleme Seviyesi</span>
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
      )}

      {/* AI Traditional Input Box with Mic Access Launcher */}
      {!isRecording && (
        <div className="p-6 border-t border-outline bg-white">
          <div className="relative flex items-end gap-2 bg-surface-dim border border-outline rounded-xl p-2.5 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
            <textarea
              ref={inputRef}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Mentorunuza sorunuzu yazın veya kavram açıklama kaydı başlatın..."
              className="flex-1 bg-transparent p-1.5 text-xs outline-none border-none resize-none transition-all placeholder:text-on-surface-variant/40 text-primary font-medium focus:ring-0 leading-relaxed"
            />
            
            <div className="flex gap-1.5 shrink-0">
              {/* Mic Icon representing Speech-to-Text Analysis capability */}
              <button
                onClick={startRecording}
                title="Google STT ile Kavramı Anlat"
                className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all cursor-pointer relative"
              >
                <Mic size={15} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
              </button>

              <button
                onClick={handleSend}
                className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-md hover:bg-primary/95 active:scale-95 transition-all cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
          <div className="mt-1.5 text-center">
            <span className="text-[9px] text-on-surface-variant/50 font-semibold block leading-tight">
              🎙️ <strong className="text-rose-600">Ses Kaydı:</strong> Öğrendiğin bir kuralı kendi kelimelerinle anlatarak kalıcı hafızanı test et!
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
