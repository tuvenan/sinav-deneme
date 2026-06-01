import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Sparkles, Check, Settings, TrendingUp, FolderOpen, 
  Upload, Zap, BookOpen, Users, Sliders, Database, Mic, Plus, 
  Trash2, Play, RefreshCw, CheckCircle, Search, Code, Cpu, Info, 
  ArrowRight, Save, LayoutGrid, Award, Server, AlertCircle, Palette, Image
} from 'lucide-react';
import type { Question, Difficulty, SolveHistory, Message } from '../types';
import ResourcesView from './ResourcesView';

interface AdminViewProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  solveHistory: SolveHistory[];
  setSolveHistory: React.Dispatch<React.SetStateAction<SolveHistory[]>>;
  correctStreak: number;
  setCorrectStreak: (s: number) => void;
  progress: number;
  setProgress: (p: number) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentQuestion: Question;
  setCurrentQuestion: (q: Question) => void;
}

export default function AdminView({
  questions,
  setQuestions,
  solveHistory,
  setSolveHistory,
  correctStreak,
  setCorrectStreak,
  progress,
  setProgress,
  messages,
  setMessages,
  currentQuestion,
  setCurrentQuestion
}: AdminViewProps) {
  // Navigation tabs inside the Admin Panel
  const [adminTab, setAdminTab] = useState<'genel' | 'sorular' | 'ogrenci' | 'prompts' | 'stt-test' | 'bulut-log' | 'kaynaklar' | 'stil'>('genel');

  // Logs stream simulated for database and cloud operations
  const [logs, setLogs] = useState<{ id: string; time: string; level: 'info' | 'warn' | 'success' | 'err'; tag: string; msg: string }[]>(() => [
    { id: '1', time: new Date().toLocaleTimeString('tr-TR'), level: 'success', tag: 'SYSTEM', msg: 'Admin Kontrol Paneli başarıyla başlatıldı.' },
    { id: '2', time: new Date().toLocaleTimeString('tr-TR'), level: 'info', tag: 'FIREBASE', msg: 'Firestore offline_persistence etkinleştirildi (157 cached docs found).' },
    { id: '3', time: new Date().toLocaleTimeString('tr-TR'), level: 'info', tag: 'STT', msg: 'Google Cloud Speech-to-Text v2 API hazır durumda.' }
  ]);

  const addLog = (level: 'info' | 'warn' | 'success' | 'err', tag: string, msg: string) => {
    setLogs(prev => [
      { id: Date.now().toString(), time: new Date().toLocaleTimeString('tr-TR'), level, tag, msg },
      ...prev.slice(0, 49) // Keep last 50 logs
    ]);
  };

  // State for adding/editing questions
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qText, setQText] = useState('');
  const [qContext, setQContext] = useState('');
  const [qQuery, setQQuery] = useState('');
  const [qDifficulty, setQDifficulty] = useState<Difficulty>('Orta');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [qHint, setQHint] = useState('');
  const [qErrorAnalysis, setQErrorAnalysis] = useState('');
  const [qErrorType, setQErrorType] = useState('Kural Karışıklığı');
  const [qImageUrl, setQImageUrl] = useState('');

  // Prompt calibration state
  const [promptTone, setPromptTone] = useState<'Sokratesçi' | 'Akademik' | 'Çok Yumuşak' | 'Motivasyonel'>('Sokratesçi');
  const [maxCompletionTokens, setMaxCompletionTokens] = useState(500);
  const [temperature, setTemperature] = useState(0.4);
  const [customSystemPrompt, setCustomSystemPrompt] = useState(
    'Sen LGS Sözel & Sayısal öğrenci mentorusun. Matematik öğretirken doğrudan cevap vermek yerine öğrenciye Sokratesvari rehber ipuçları sun ve adım adım yönlendir. Ayrıca ses kayıt analizlerinde matematiksel kural hatalarını anında teşhis edip alternatif çözümler geliştir.'
  );

  // STT Live Simulator Test state
  const [testVoiceInput, setTestVoiceInput] = useState('');
  const [testOutputResult, setTestOutputResult] = useState<string | null>(null);

  // Invalidate cache or run auto tests stats
  const [totalQueries, setTotalQueries] = useState(134);
  const [latency, setLatency] = useState(180);

  // Dynamic Style Management state
  const [styleConfig, setStyleConfig] = useState(() => {
    const saved = localStorage.getItem('lgs_theme_config');
    if (saved) {
      try {
        return {
          primaryColor: '#0f172a',
          accentColor: '#4f46e5',
          surfaceColor: '#fdfdfd',
          surfaceDim: '#f1f5f9',
          onSurface: '#0f172a',
          radiusXl: '0.75rem',
          fontSerif: '"Playfair Display", serif',
          fontSans: '"Inter", sans-serif',
          ...JSON.parse(saved)
        };
      } catch (e) {}
    }
    return {
      primaryColor: '#0f172a',
      accentColor: '#4f46e5',
      surfaceColor: '#fdfdfd',
      surfaceDim: '#f1f5f9',
      onSurface: '#0f172a',
      radiusXl: '0.75rem',
      fontSerif: '"Playfair Display", serif',
      fontSans: '"Inter", sans-serif'
    };
  });

  const updateStyleParam = (key: string, value: string) => {
    const newConfig = { ...styleConfig, [key]: value };
    setStyleConfig(newConfig);
    localStorage.setItem('lgs_theme_config', JSON.stringify(newConfig));
    // Dispatch events to instantly update inside the SPA
    window.dispatchEvent(new Event('theme-changed'));
    window.dispatchEvent(new Event('storage'));
    addLog('success', 'STYLE_UPDATE', `Stil parametresi "${key}" değeri "${value}" olarak güncellendi.`);
  };

  const applyThemePreset = (presetName: string, preset: typeof styleConfig) => {
    setStyleConfig(preset);
    localStorage.setItem('lgs_theme_config', JSON.stringify(preset));
    window.dispatchEvent(new Event('theme-changed'));
    window.dispatchEvent(new Event('storage'));
    addLog('success', 'THEME_PRESET', `"${presetName}" stil / tema şablonu başarıyla uygulandı.`);
  };

  const resetStylesToDefault = () => {
    localStorage.removeItem('lgs_theme_config');
    const defaults = {
      primaryColor: '#0f172a',
      accentColor: '#4f46e5',
      surfaceColor: '#fdfdfd',
      surfaceDim: '#f1f5f9',
      onSurface: '#0f172a',
      radiusXl: '0.75rem',
      fontSerif: '"Playfair Display", serif',
      fontSans: '"Inter", sans-serif'
    };
    setStyleConfig(defaults);
    window.dispatchEvent(new Event('theme-changed'));
    window.dispatchEvent(new Event('storage'));
    addLog('warn', 'STYLE_RESET', 'Sitenin genel görsel stilleri orijinal varsayılan ayarlara geri döndürüldü.');
  };

  // Sync questions with localstorage if updated
  const saveQuestionsToStorage = (updatedQs: Question[]) => {
    localStorage.setItem('lgs_questions_pool', JSON.stringify(updatedQs));
  };

  // Run simulated scheduler to random update load metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => {
        const delta = Math.floor(Math.random() * 41) - 20; // -20 to +20
        return Math.max(120, Math.min(prev + delta, 340));
      });
      setTotalQueries(q => q + (Math.floor(Math.random() * 3) === 0 ? 1 : 0));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Set initial editing properties when selecting a question
  const selectQuestionForEdit = (q: Question) => {
    setEditingQuestionId(q.id);
    setQText(q.text);
    setQContext(q.context);
    setQQuery(q.query);
    setQDifficulty(q.difficulty);
    setOptA(q.options.find(o => o.label === 'A')?.value || '');
    setOptB(q.options.find(o => o.label === 'B')?.value || '');
    setOptC(q.options.find(o => o.label === 'C')?.value || '');
    setOptD(q.options.find(o => o.label === 'D')?.value || '');
    
    const correctVal = q.options.find(o => o.isCorrect)?.label as 'A' | 'B' | 'C' | 'D' || 'A';
    setCorrectOption(correctVal);
    setQHint(q.hint);
    setQErrorAnalysis(q.errorAnalysis);
    setQErrorType(q.errorType);
    setQImageUrl(q.imageUrl || '');
  };

  const handleSaveQuestion = () => {
    if (!qText.trim() || !qQuery.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      alert('Lütfen temel soru metinlerini ve tüm şıkları eksiksiz doldurun!');
      return;
    }

    const compiledOptions = [
      { label: 'A', value: optA, isCorrect: correctOption === 'A' },
      { label: 'B', value: optB, isCorrect: correctOption === 'B' },
      { label: 'C', value: optC, isCorrect: correctOption === 'C' },
      { label: 'D', value: optD, isCorrect: correctOption === 'D' },
    ];

    const targetId = editingQuestionId || Date.now().toString();

    const updatedQuestion: Question = {
      id: targetId,
      difficulty: qDifficulty,
      text: qText,
      context: qContext,
      query: qQuery,
      options: compiledOptions,
      hint: qHint,
      errorAnalysis: qErrorAnalysis,
      errorType: qErrorType,
      imageUrl: qImageUrl.trim() || undefined
    };

    let newPool: Question[] = [];
    if (editingQuestionId) {
      newPool = questions.map(q => q.id === editingQuestionId ? updatedQuestion : q);
      addLog('success', 'QUESTION', `"${targetId}" ID'li soru başarıyla güncellendi.`);
    } else {
      newPool = [...questions, updatedQuestion];
      addLog('success', 'QUESTION', `Havuz a yeni bir LGS sorusu eklendi. ID: ${targetId}`);
    }

    setQuestions(newPool);
    saveQuestionsToStorage(newPool);

    // If we updated the active question, refresh it too
    if (currentQuestion.id === targetId) {
      setCurrentQuestion(updatedQuestion);
    }

    // Reset fields
    resetQuestionForm();
  };

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQText('');
    setQContext('');
    setQQuery('');
    setQDifficulty('Orta');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectOption('A');
    setQHint('');
    setQErrorAnalysis('');
    setQErrorType('Kural Karışıklığı');
    setQImageUrl('');
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert('Sistemde en az 1 adet soru kalmalıdır!');
      return;
    }
    if (confirm('Bu soruyu havuzdan kalıcı olarak silmek istediğinizden emin misiniz?')) {
      const filtered = questions.filter(q => q.id !== id);
      setQuestions(filtered);
      saveQuestionsToStorage(filtered);
      addLog('warn', 'QUESTION', `"${id}" ID'li soru başarıyla silindi.`);
      if (currentQuestion.id === id) {
        setCurrentQuestion(filtered[0]);
      }
    }
  };

  // Test custom input using our backend algorithms and output matching
  const testSTTPromoMatch = () => {
    if (!testVoiceInput.trim()) {
      alert('Lütfen bir test cümlesi yazın!');
      return;
    }

    const text = testVoiceInput.toLowerCase();
    let predictedResponse = '';

    if (text.includes('üs') && text.includes('çarpma') && (text.includes('çarp') || text.includes('on beş') || text.includes('onbeş'))) {
      predictedResponse = 'Kural Karışıklığı Analizi: Üsleri doğrudan toplamak yerine çarptın! (Predictive Match found!)';
    } else if (text.includes('kök') && text.includes('toplama') && (text.includes('kök iç') || text.includes('sekiz') || text.includes('kök sekiz'))) {
      predictedResponse = 'Temel Bilgi Hatası Analizi: Kök içlerini doğrudan toplayamazsın! (Predictive Match found!)';
    } else if (text.includes('ebob') && text.includes('ekok') && (text.includes('küçük') || text.includes('bir araya') || text.includes('bina'))) {
      predictedResponse = 'EBOB/EKOK Karışıklığı Analizi: Parçadan bütüne giderken EKOK kullanılmalıdır! (Predictive Match found!)';
    } else {
      predictedResponse = 'Genel Motivasyon Rehberliği: Belirli bir kaza kelimesi bulunamadı. Genel ilerleme raporu önerildi.';
    }

    setTestOutputResult(predictedResponse);
    addLog('info', 'STT_DIAGNOSTIC', `Ses girişi simüle edildi: "${testVoiceInput.substring(0, 30)}..." -> Sonuç: ${predictedResponse}`);
  };

  return (
    <div className="p-8 space-y-8 bg-[#fafafa] min-h-screen">
      
      {/* Super Elite Header with Matrix Vibe */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-outline pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-neutral-900 text-white rounded font-mono text-[9px] font-black uppercase tracking-widest">
              GELİŞMİŞ SİSTEM YÖNETİCİSİ
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-3xl font-serif font-black text-primary tracking-tight mt-1">
            EduAi Admin Merkezi
          </h1>
          <p className="text-xs text-on-surface-variant font-medium mt-1 leading-relaxed">
            Sistem parametrelerini kalibre edin, soru havuzunu yönetin ve Google STT ses tanıma testlerini yapın.
          </p>
        </div>

        {/* Dynamic Sync Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              addLog('success', 'SYSTEM_RESET', 'Tüm veri önbelleği başarıyla sıfırlandı.');
              alert('Uygulama önbelleği temizlendi ve veri akışları yenilendi.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 border border-outline rounded-lg text-xs font-bold text-primary transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw size={12} className="text-neutral-500" />
            <span>Önbelleği Temizle</span>
          </button>
          
          <div className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-800 text-white rounded-lg flex items-center gap-2 text-xs font-mono font-bold shadow-md">
            <Server size={12} className="text-emerald-400" />
            <span>DB State: OK</span>
          </div>
        </div>
      </div>

      {/* Overview Stats Bento Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* Stat 1 */}
        <div className="bg-white border border-outline p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] text-on-surface-variant font-black tracking-widest uppercase">Toplam Soru Havuzu</span>
            <div className="text-2xl font-serif font-black text-primary">{questions.length} LGS Sorusu</div>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 pt-1">
              <Check size={10} />
              <span>Hepsi aktif ve kalibre</span>
            </p>
          </div>
          <div className="bg-primary/5 p-3 rounded-xl text-primary">
            <BookOpen size={20} />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white border border-outline p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] text-on-surface-variant font-black tracking-widest uppercase">Gecikme (Latency)</span>
            <div className="text-2xl font-serif font-black text-primary font-mono">{latency} ms</div>
            <p className="text-[10px] text-on-surface-variant font-semibold pt-1">Google Cloud STT API</p>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
            <Cpu size={20} />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white border border-outline p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] text-on-surface-variant font-black tracking-widest uppercase">Simüle Edilen Loglar</span>
            <div className="text-2xl font-serif font-black text-primary font-mono">{totalQueries}</div>
            <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping inline-block mr-1" />
              <span>Canlı etkinlik akışı</span>
            </p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
            <Code size={20} />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white border border-outline p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] text-on-surface-variant font-black tracking-widest uppercase">Firebase Cache</span>
            <div className="text-2xl font-serif font-black text-primary">100% Sorunsuz</div>
            <p className="text-[10px] text-neutral-500 font-semibold pt-1">Offline Modu: Aktif</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 border border-emerald-100">
            <Database size={20} />
          </div>
        </div>

        {/* Stat 5 (Genel Performans Özeti) */}
        <div className="bg-white border border-outline p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1 w-full">
            <span className="text-[10px] text-on-surface-variant font-black tracking-widest uppercase block">Genel Performans Özeti</span>
            <div className="flex items-baseline justify-between pt-0.5">
              <span className="text-[10px] text-on-surface-variant/80 font-bold">Aktif Öğrenci:</span>
              <span className="text-sm font-mono font-black text-primary">1,480</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-indigo-600/80 font-bold">Günlük Çözüm Ort:</span>
              <span className="text-sm font-mono font-black text-indigo-600">42.5 / gün</span>
            </div>
            <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 pt-1 border-t border-dashed border-outline-variant mt-1.5">
              <TrendingUp size={10} className="shrink-0 text-emerald-500" />
              <span>Haftalık çözüm %12.4 arttı</span>
            </p>
          </div>
          <div className="bg-indigo-50/60 p-2.5 rounded-xl text-indigo-600 border border-indigo-100 shrink-0 self-start ml-2">
            <Users size={16} />
          </div>
        </div>

      </div>

      {/* Sub-nav Buttons Block */}
      <div className="flex gap-2 border-b border-outline pb-2.5 overflow-x-auto flex-nowrap scrollbar-none">
        
        {/* General Tab */}
        <button
          onClick={() => setAdminTab('genel')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            adminTab === 'genel' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-neutral-100 hover:text-primary'
          }`}
        >
          <Sliders size={14} className="shrink-0" />
          <span>Genel Görünüm</span>
        </button>

        {/* Questions Manager */}
        <button
          onClick={() => setAdminTab('sorular')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            adminTab === 'sorular' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-neutral-100 hover:text-primary'
          }`}
        >
          <BookOpen size={14} className="shrink-0" />
          <span>Soru Yönetimi ({questions.length})</span>
        </button>

        {/* Student Simulation Parameters */}
        <button
          onClick={() => setAdminTab('ogrenci')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            adminTab === 'ogrenci' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-neutral-100 hover:text-primary'
          }`}
        >
          <Users size={14} className="shrink-0" />
          <span>Öğrenci Simülasyonu</span>
        </button>

        {/* Prompt Calibration Panels */}
        <button
          onClick={() => setAdminTab('prompts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            adminTab === 'prompts' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-neutral-100 hover:text-primary'
          }`}
        >
          <Settings size={14} className="shrink-0" />
          <span>Yapay Zeka Prompt Kalibrasyonu</span>
        </button>

        {/* STT Keyword Diagnostic Sandbox */}
        <button
          onClick={() => setAdminTab('stt-test')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            adminTab === 'stt-test' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-neutral-100 hover:text-primary'
          }`}
        >
          <Mic size={14} className="shrink-0" />
          <span>Sesli Analiz Tanı Testi (STT)</span>
        </button>

        {/* Logs Stream Panel */}
        <button
          onClick={() => setAdminTab('bulut-log')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            adminTab === 'bulut-log' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-neutral-100 hover:text-primary'
          }`}
        >
          <Code size={14} className="shrink-0" />
          <span>Canlı İzleme Günlüğü ({logs.length})</span>
        </button>

        {/* PDF & Kaynak Yönetimi */}
        <button
          onClick={() => setAdminTab('kaynaklar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            adminTab === 'kaynaklar' ? 'bg-[#4f46e5] text-white shadow-sm' : 'text-on-surface-variant hover:bg-neutral-100 hover:text-primary'
          }`}
        >
          <FolderOpen size={14} className="shrink-0" />
          <span>PDF &amp; Kaynak Yönetimi</span>
        </button>

        {/* Tema & Görsel Stil Yönetimi */}
        <button
          onClick={() => setAdminTab('stil')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            adminTab === 'stil' ? 'bg-[#ea580c] text-white shadow-sm' : 'text-on-surface-variant hover:bg-neutral-100 hover:text-primary'
          }`}
        >
          <Palette size={14} className="shrink-0" />
          <span>Görsel Stil &amp; Tema</span>
        </button>

      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Core Workspace Left Panel Area */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* 1. GENERAL TAB PANEL */}
          {adminTab === 'genel' && (
            <div className="space-y-6">
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-light-outline">
                  <Sliders size={18} className="text-primary" />
                  <h2 className="text-lg font-serif font-black text-primary">Sistem Çapında Genel Ayarlar</h2>
                </div>
                
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  EduAi platformuna enjekte edilmiş olan gelişmiş yönetim katmanına hoş geldiniz. Bu panel üzerinden öğrencilerinizin arayüzünde görünen zorluk ayarlarını, prompt esnemelerini, ses tanıma motoru parametrelerini ve soru veri ambarını gerçek zamanlı manipüle edebilirsiniz. Yapılan her güncelleme, çalışma ekranına doğrudan yansımaktadır.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  
                  {/* Option Block A */}
                  <div className="p-4 bg-surface-dim/40 rounded-xl border border-outline/50 space-y-2">
                    <h3 className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-500" />
                      <span>Hızlı Veri Enjeksiyonu</span>
                    </h3>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      LGS müfredatında yer alan üslü ve köklü sayılar kazanımlarını simüle eden test setlerini veri ambarına ekler.
                    </p>
                    <button
                      onClick={() => {
                        const countBefore = questions.length;
                        const newQ: Question = {
                          id: (Date.now() + 10).toString(),
                          difficulty: 'Zor',
                          text: `Gelişmiş LGS Matematik Deneme Sorusu: $a \\neq 0$ olmak üzere bir kenarı $a^3$ metre olan bir oyun parkının etrafı her bir kenarının ortasında lamba bulunacak biçimde tasarlanmıştır.`,
                          context: '"Bu oyun parkının bir dış kenarı $a^{12}$ birim kareye genişletilmek istenmektedir."',
                          query: 'Toplam alanın genişleme katsayısı kaç katına karşılık gelmektedir?',
                          options: [
                            { label: 'A', value: 'a¹²', isCorrect: false },
                            { label: 'B', value: 'a⁹', isCorrect: true },
                            { label: 'C', value: 'a⁶', isCorrect: false },
                            { label: 'D', value: 'a³', isCorrect: false }
                          ],
                          hint: 'Kare alan formülünü ($E = S^2$) kullanarak önce ilk alanı, daha sonra yeni alanı bulmalı ve oranlamalısınız.',
                          errorAnalysis: 'Üssün üssünü alırken çarpma işlemi yerine toplama hatasına düşmüş olabilirsiniz.',
                          errorType: 'Üssün Üssü Karışıklığı'
                        };
                        const updated = [...questions, newQ];
                        setQuestions(updated);
                        saveQuestionsToStorage(updated);
                        addLog('success', 'INJECT', 'Zor seviye akıllı deneme sorusu havuzla eşleştirildi.');
                        alert('Zor seviye akıllı LGS sorusu başarıyla sisteme enjekte edildi!');
                      }}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-[10px] uppercase font-bold tracking-wider rounded-lg shadow transition-all cursor-pointer"
                    >
                      Yeni Soru Enjekte Et
                    </button>
                  </div>

                  {/* Option Block B */}
                  <div className="p-4 bg-surface-dim/40 rounded-xl border border-outline/50 space-y-2">
                    <h3 className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-rose-600" />
                      <span>Sokratik Soruşturma Derecesi</span>
                    </h3>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Yapay zeka asistanının ipucu verirken öğrenciye doğrudan kuralı fısıldama yerine "Düşünme Eğrisi" sorma oranı sıklığı.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="range"
                        min="20"
                        max="100"
                        defaultValue="85"
                        className="w-full accent-primary h-1 rounded-lg"
                        onChange={(e) => {
                          addLog('info', 'CALIBRATION', `Sokratik düşünme eğrisi katsayısı %${e.target.value} olarak güncellendi.`);
                        }}
                      />
                      <span className="text-xs font-mono font-bold text-primary shrink-0">Normal Sıklık (85%)</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Advanced System Integration Cards */}
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-light-outline">
                  <Database size={18} className="text-primary" />
                  <h2 className="text-lg font-serif font-black text-primary">Bağlı Entegrasyon Veri Yolları</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* DB 1 */}
                  <div className="p-4 border border-outline rounded-2xl flex flex-col justify-between space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-primary">Google Cloud STT</span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant leading-normal block">
                      Sesle kural anlatımında LGS hatalarını yakalayan Google Speech-to-Text motoru.
                    </span>
                    <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold self-start select-none">
                      CONNECTED (tr-TR)
                    </span>
                  </div>

                  {/* DB 2 */}
                  <div className="p-4 border border-outline rounded-2xl flex flex-col justify-between space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <span className="text-xs font-bold text-primary">Firebase Cloud Firestore</span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant leading-normal block">
                      Öğrenci profilleri, akıllı ayarları ve çözülmüş soru geçmişi senkronizasyonu.
                    </span>
                    <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150 font-bold self-start select-none">
                      CACHED / PERSISTENT
                    </span>
                  </div>

                  {/* DB 3 */}
                  <div className="p-4 border border-outline rounded-2xl flex flex-col justify-between space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-primary">Google Calendar API</span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant leading-normal block">
                      LGS Hedefli çalışma saatleri, özel etiket tanımları ve takvim hatırlatıcıları.
                    </span>
                    <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-bold self-start select-none">
                      READY FOR OAUTH
                    </span>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* 2. QUESTIONS MANAGER TAB PANEL */}
          {adminTab === 'sorular' && (
            <div className="space-y-6">
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-6">
                
                <div className="flex items-center justify-between pb-2 border-b border-light-outline flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-primary" />
                    <h2 className="text-lg font-serif font-black text-primary">
                      {editingQuestionId ? `Soruyu Düzenliyorsunuz: ID ${editingQuestionId}` : 'Yeni LGS Matematik Sorusu Ekle'}
                    </h2>
                  </div>
                  {editingQuestionId && (
                    <button
                      onClick={resetQuestionForm}
                      className="px-3 py-1 bg-surface-dim border border-outline hover:text-primary transition-all text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer"
                    >
                      Düzenlemeyi İptal Et
                    </button>
                  )}
                </div>

                {/* Soru Düzenleme / Ekleme Formu */}
                <div className="space-y-4 text-xs font-semibold">
                  
                  {/* Üst grup: Zorluk ve Hata Tipi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-primary block">Soru Zorluğu</label>
                      <select
                        value={qDifficulty}
                        onChange={(e) => setQDifficulty(e.target.value as Difficulty)}
                        className="w-full bg-surface-dim border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-bold"
                      >
                        <option value="Kolay">Kolay Seviye</option>
                        <option value="Orta">Orta Seviye</option>
                        <option value="Zor">Zor Seviye (Derece)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-primary block">Sık Yapılan Hata Türü (Error Type)</label>
                      <input
                        type="text"
                        placeholder="Örn: Kural Karışıklığı, İşlem Hatası"
                        value={qErrorType}
                        onChange={(e) => setQErrorType(e.target.value)}
                        className="w-full bg-surface-dim border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-bold"
                      />
                    </div>
                  </div>

                  {/* Soru Gövdesi, Bağlam ve Soru Kökü */}
                  <div className="space-y-1.5">
                    <label className="text-primary block">Başlangıç Bağlamı (Context Quote / Tırnak İçindeki İfade)</label>
                    <input
                      type="text"
                      placeholder="Örn: 'Üslü ifadelerde tabanlar aynı olduğunda...'"
                      value={qContext}
                      onChange={(e) => setQContext(e.target.value)}
                      className="w-full bg-surface-dim border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-primary block">Soru Ana Metni (Giriş Hikayesi)</label>
                    <textarea
                      rows={3}
                      placeholder="Sorunun senaryosunu ve matematiksel hikayesini girin..."
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      className="w-full bg-surface-dim border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-medium resize-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-primary block">Soru Sorusu (Net Query - 'Buna göre toplam alan kaç metrekaredir?')</label>
                    <input
                      type="text"
                      placeholder="Kullanıcıdan doğrudan istenen işlem kökünü girin..."
                      value={qQuery}
                      onChange={(e) => setQQuery(e.target.value)}
                      className="w-full bg-surface-dim border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-medium"
                    />
                  </div>

                  {/* Şıklar Grubu */}
                  <div className="space-y-2">
                    <label className="text-primary block">Seçenekler & Şıklar</label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* A opsiyon */}
                      <div className="flex items-center gap-2 bg-surface-dim/40 border border-outline/65 p-2 rounded-xl">
                        <span className="w-6 h-6 rounded-md bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold font-mono text-xs">A</span>
                        <input
                          type="text"
                          placeholder="A Değeri"
                          value={optA}
                          onChange={(e) => setOptA(e.target.value)}
                          className="flex-1 bg-transparent p-1.5 outline-none border-none text-primary font-bold focus:ring-0"
                        />
                      </div>

                      {/* B opsiyon */}
                      <div className="flex items-center gap-2 bg-surface-dim/40 border border-outline/65 p-2 rounded-xl">
                        <span className="w-6 h-6 rounded-md bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold font-mono text-xs">B</span>
                        <input
                          type="text"
                          placeholder="B Değeri"
                          value={optB}
                          onChange={(e) => setOptB(e.target.value)}
                          className="flex-1 bg-transparent p-1.5 outline-none border-none text-primary font-bold focus:ring-0"
                        />
                      </div>

                      {/* C opsiyon */}
                      <div className="flex items-center gap-2 bg-surface-dim/40 border border-outline/65 p-2 rounded-xl">
                        <span className="w-6 h-6 rounded-md bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold font-mono text-xs">C</span>
                        <input
                          type="text"
                          placeholder="C Değeri"
                          value={optC}
                          onChange={(e) => setOptC(e.target.value)}
                          className="flex-1 bg-transparent p-1.5 outline-none border-none text-primary font-bold focus:ring-0"
                        />
                      </div>

                      {/* D opsiyon */}
                      <div className="flex items-center gap-2 bg-surface-dim/40 border border-outline/65 p-2 rounded-xl">
                        <span className="w-6 h-6 rounded-md bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold font-mono text-xs">D</span>
                        <input
                          type="text"
                          placeholder="D Değeri"
                          value={optD}
                          onChange={(e) => setOptD(e.target.value)}
                          className="flex-1 bg-transparent p-1.5 outline-none border-none text-primary font-bold focus:ring-0"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Doğru Şık Seçimi, İpucu, Detaylı Hata Analizleri */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-primary block">Doğru Şık Hangisi?</label>
                      <select
                        value={correctOption}
                        onChange={(e) => setCorrectOption(e.target.value as 'A' | 'B' | 'C' | 'D')}
                        className="w-full bg-surface-dim border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-emerald-700 font-bold"
                      >
                        <option value="A">A şıkkı doğru cevap</option>
                        <option value="B">B şıkkı doğru cevap</option>
                        <option value="C">C şıkkı doğru cevap</option>
                        <option value="D">D şıkkı doğru cevap</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-primary block">Süreç İpucu (Hint / Socrates Hint)</label>
                      <input
                        type="text"
                        placeholder="Örn: 25 sayısını 5 sayısının karesi olarak yazmayı dene..."
                        value={qHint}
                        onChange={(e) => setQHint(e.target.value)}
                        className="w-full bg-surface-dim border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-medium"
                      />
                    </div>
                  </div>

                  {/* Görsel İpucu URL */}
                  <div className="space-y-1.5 font-semibold text-xs">
                    <label className="text-primary block flex items-center gap-1.5">
                      Görsel İpucu URL'si <span className="font-normal text-on-surface-variant/70 italic">(İsteğe bağlı - Diyagramlar, grafikler ve geometrik çizimler için görsel web adresi veya lokal görsel yolu)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: https://images.unsplash.com/... veya lokal görsel adresi"
                      value={qImageUrl}
                      onChange={(e) => setQImageUrl(e.target.value)}
                      className="w-full bg-surface-dim border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-primary block">Hedeflenen Hata Analizi Tavsiyesi (Error Warning Suggestion)</label>
                    <textarea
                      rows={2}
                      placeholder="Öğrenci yanlış şıkkı tıkladığında hata analizi panelinde belirecek düzeltici öneriyi buraya yazın..."
                      value={qErrorAnalysis}
                      onChange={(e) => setQErrorAnalysis(e.target.value)}
                      className="w-full bg-surface-dim border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-medium resize-none leading-relaxed"
                    />
                  </div>

                  {/* Kaydetme Butonu */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={resetQuestionForm}
                      className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-primary uppercase font-bold text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Temizle
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveQuestion}
                      className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white uppercase font-bold text-[10px] tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save size={14} />
                      <span>{editingQuestionId ? 'Soruyu Güncelle' : 'Soruyu Havuza Ekle'}</span>
                    </button>
                  </div>

                </div>

              </div>

              {/* Soru Listesi Tablosu */}
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-light-outline">
                  <h3 className="font-serif font-black text-lg text-primary">Sistemdeki Aktif Soru Havuzu</h3>
                  <span className="text-xs font-mono font-bold bg-surface-dim px-2.5 py-1 rounded-full text-primary border border-outline">
                    Ölçü: {questions.length} Soru
                  </span>
                </div>

                <div className="space-y-3">
                  {questions.map((q, idx) => {
                    const isCorrectOptionLabel = q.options.find(o => o.isCorrect)?.label;
                    return (
                      <div
                        key={q.id}
                        className={`p-4 border rounded-2xl flex items-start justify-between gap-4 transition-all hover:bg-surface-bright ${
                          currentQuestion.id === q.id 
                            ? 'border-primary bg-primary/[0.01] shadow-sm' 
                            : 'border-outline bg-white'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-neutral-100 border border-neutral-200 text-neutral-800 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                              Soru #{q.id}
                            </span>
                            {q.imageUrl && (
                              <span className="bg-sky-50 border border-sky-100 text-sky-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1" title="Görsel İpucu Mevcut">
                                <Image size={10} className="text-sky-600" />
                                <span>Görsel İpucu</span>
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              q.difficulty === 'Zor' 
                                ? 'bg-rose-50 border border-rose-100 text-rose-600' 
                                : q.difficulty === 'Orta' 
                                ? 'bg-indigo-50 border border-indigo-100 text-indigo-600' 
                                : 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                            }`}>
                              {q.difficulty}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                              Hata: {q.errorType}
                            </span>
                          </div>

                          <p className="text-xs text-primary font-bold font-serif whitespace-pre-wrap leading-relaxed line-clamp-2">
                            {q.text}
                          </p>

                          <div className="flex items-center gap-3 text-[10px] text-on-surface-variant font-semibold">
                            <span>Seçenekler: {q.options.map(o => `${o.label}) ${o.value}`).join(' | ')}</span>
                            <span className="text-emerald-700 font-black">✔ Doğru: {isCorrectOptionLabel}</span>
                          </div>
                        </div>

                        {/* Soru Aksiyonları */}
                        <div className="flex gap-1.5 shrink-0 self-center">
                          <button
                            onClick={() => {
                              setCurrentQuestion(q);
                              addLog('info', 'SELECT_QUESTION', `Aktif soru "${q.id}" olarak değiştirildi.`);
                            }}
                            title="Çalışma Ekranında Önizle"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 p-2 rounded-lg transition-all text-[11px] font-bold cursor-pointer"
                          >
                            Önizle
                          </button>
                          <button
                            onClick={() => selectQuestionForEdit(q)}
                            title="Düzenle"
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 p-2 rounded-lg transition-all text-[11px] font-bold cursor-pointer"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            title="Kalıcı Olarak Sil"
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 p-2 rounded-lg transition-all text-[11px] font-bold cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          )}

          {/* 3. STUDENT SIMULATION TAB PANEL */}
          {adminTab === 'ogrenci' && (
            <div className="space-y-6">
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-6">
                
                <div className="flex items-center gap-2 pb-2 border-b border-light-outline">
                  <Users size={18} className="text-primary" />
                  <h2 className="text-lg font-serif font-black text-primary">Öğrenci Durum ve Simülasyon Editörü</h2>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Öğrencinin anlık çözme geçmişini, üst üste doğru cevaplama serilerini (streak) ve ilerleme oranlarını simüle edin. Bu ayarlardaki değişiklikler, ana çalışma panelindeki LGS Sözel Mentor widgetlarında ve yan panel başarı göstergelerinde anında güncellenir.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs font-semibold">
                  
                  {/* Streak & Progress */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-primary block flex justify-between">
                        <span>Anlık Başarı Zinciri (Correct Streak)</span>
                        <span className="font-mono text-indigo-600 font-black">{correctStreak} Soru</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={correctStreak}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setCorrectStreak(val);
                          addLog('info', 'SIMULATION', `Başarı serisi (streak) ${val} olarak el ile ayarlandı.`);
                        }}
                        className="w-full accent-primary h-1 rounded bg-neutral-150"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-primary block flex justify-between">
                        <span>Akademik İlerleme Oranı (%)</span>
                        <span className="font-mono text-emerald-600 font-black">{progress}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setProgress(val);
                          addLog('info', 'SIMULATION', `Akademik ilerleme seviyesi %${val} olarak güncellendi.`);
                        }}
                        className="w-full accent-primary h-1 rounded bg-neutral-150"
                      />
                    </div>

                    {/* Premium / Membership status simulator */}
                    <div className="bg-surface-dim/30 p-4 border border-outline rounded-2xl space-y-2">
                      <span className="text-[9px] font-black text-primary block uppercase tracking-widest">Üyelik Statüsü Değiştirici</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const current = JSON.parse(localStorage.getItem('lgs_settings') || '{}');
                            const updated = { ...current, membershipType: 'Standart' };
                            localStorage.setItem('lgs_settings', JSON.stringify(updated));
                            window.dispatchEvent(new Event('storage'));
                            addLog('info', 'SIMULATION', 'Öğrenci üyelik tipi "Standart" olarak simüle edildi.');
                            alert('Üyelik tipi Standart olarak güncellendi.');
                          }}
                          className="flex-1 py-1.5 bg-white border border-outline hover:bg-neutral-50 rounded-lg text-[10px] font-bold text-center text-primary uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Standart Üyelik
                        </button>
                        <button
                          onClick={() => {
                            const current = JSON.parse(localStorage.getItem('lgs_settings') || '{}');
                            const updated = { ...current, membershipType: 'Premium LGS Şampiyon' };
                            localStorage.setItem('lgs_settings', JSON.stringify(updated));
                            window.dispatchEvent(new Event('storage'));
                            addLog('success', 'SIMULATION', 'Öğrenci üyelik tipi "Premium LGS Şampiyon" olarak simüle edildi.');
                            alert('Tebrikler! Üyelik tipi sistem genelinde Premium LGS Şampiyon derecesine yükseltildi.');
                          }}
                          className="flex-1 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-lg text-[10px] font-bold text-center uppercase tracking-wider transition-all shadow-md cursor-pointer"
                        >
                          👑 Premium Şampiyon Yap
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inject mock solve history */}
                  <div className="space-y-4">
                    <div className="bg-white border rounded-2xl p-4 space-y-3 shadow-inner">
                      <h3 className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Award size={14} className="text-primary" />
                        <span>Soru Çözme Geçmişini Manipüle Et</span>
                      </h3>
                      <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed">
                        Grafikleri ve analiz dashboardunu test etmek için anında yapay çözülmüş LGS soru kayıtları oluşturabilirsiniz.
                      </p>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            const newMock: SolveHistory = {
                              questionId: Math.floor(Math.random() * 1000).toString(),
                              isCorrect: true,
                              timeSpent: Math.floor(Math.random() * 80) + 20,
                              difficulty: 'Zor'
                            };
                            const updated = [...solveHistory, newMock];
                            setSolveHistory(updated);
                            addLog('success', 'SIMULATION', 'Çözme Geçmişine yapay BAŞARILI soru eklendi.');
                          }}
                          className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 rounded-lg text-[10px] uppercase font-bold text-center cursor-pointer"
                        >
                          Artı (+) Doğru Ekle
                        </button>

                        <button
                          onClick={() => {
                            const newMock: SolveHistory = {
                              questionId: Math.floor(Math.random() * 1000).toString(),
                              isCorrect: false,
                              timeSpent: Math.floor(Math.random() * 120) + 40,
                              difficulty: 'Zor'
                            };
                            const updated = [...solveHistory, newMock];
                            setSolveHistory(updated);
                            addLog('warn', 'SIMULATION', 'Çözme Geçmişine yapay HATALI soru eklendi.');
                          }}
                          className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 rounded-lg text-[10px] uppercase font-bold text-center cursor-pointer"
                        >
                          Artı (-) Yanlış Ekle
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm('Tüm soru çözme istatistiklerini temizlemek istediğinizden emin misiniz?')) {
                            setSolveHistory([]);
                            addLog('warn', 'SIMULATION', 'Tüm soru çözme istatistikleri sıfırlandı.');
                          }
                        }}
                        className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] uppercase font-black tracking-wider text-center cursor-pointer"
                      >
                        İstatistik Verisini Sıfırla
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          )}

          {/* 4. AI PROMPT CALIBRATION TAB PANEL */}
          {adminTab === 'prompts' && (
            <div className="space-y-6">
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-6">
                
                <div className="flex items-center gap-2 pb-2 border-b border-light-outline">
                  <Sliders size={18} className="text-primary" />
                  <h2 className="text-lg font-serif font-black text-primary">Yapay Zeka Mentor Kişilik Ayarları</h2>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  LGS sözel mentorunun öğrenciye yaklaşım tonunu, sistem talimatlarını ve LLM model sıcaklık (temperature) katsayılarını buradan kalibre edebilirsiniz. Bu parametreler AI Tutor kütüphanesi ve ses analiz sistem promptları ile doğrudan harmanlanır.
                </p>

                <div className="space-y-4 text-xs font-semibold">
                  
                  {/* Persona dropdown & temp */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-primary block">Mentor Yaklaşım Stili (Tone Preference)</label>
                      <select
                        value={promptTone}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setPromptTone(val);
                          addLog('info', 'AI_PROMPT', `Mentor yaklaşım stili "${val}" olarak ayarlandı.`);
                        }}
                        className="w-full bg-surface-dim border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-bold"
                      >
                        <option value="Sokratesçi">Sokratesçi Düşündürme Modu (Önerilen)</option>
                        <option value="Akademik">Akademik Değerlendirme Modu</option>
                        <option value="Çok Yumuşak">Çok Yumuşak ve Destekleyici</option>
                        <option value="Motivasyonel">Yüksek Motivasyon / Kamp Modu</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-primary block flex justify-between">
                        <span>Creativity & Strictness Temp</span>
                        <span className="font-mono text-primary font-black">{temperature}</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={temperature * 10}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) / 10;
                          setTemperature(val);
                          addLog('info', 'AI_PROMPT', `LLM Sıcaklık değeri (temperature) ${val} olarak değiştirildi.`);
                        }}
                        className="w-full h-1 accent-primary rounded bg-neutral-150"
                      />
                    </div>
                  </div>

                  {/* System Prompt TextArea */}
                  <div className="space-y-1.5">
                    <label className="text-primary block">Sistem Prompt Direktifi (Main Instruction Template)</label>
                    <textarea
                      rows={4}
                      value={customSystemPrompt}
                      onChange={(e) => setCustomSystemPrompt(e.target.value)}
                      className="w-full bg-surface-dim border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-medium resize-none leading-relaxed font-mono text-[11px]"
                    />
                  </div>

                  {/* Max completion token */}
                  <div className="space-y-1.5">
                    <label className="text-primary block flex justify-between">
                      <span>Max Response Tokens Limit</span>
                      <span className="font-mono text-neutral-500 font-bold">{maxCompletionTokens} tokens</span>
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="1500"
                      step="50"
                      value={maxCompletionTokens}
                      onChange={(e) => setMaxCompletionTokens(parseInt(e.target.value))}
                      className="w-full h-1 accent-primary rounded bg-neutral-150"
                    />
                  </div>

                  {/* Save changes mockup */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        addLog('success', 'AI_PROMPT', 'Yapay zeka sistem prompt talimatları ve katsayıları başarıyla kalibre edildi.');
                        alert('Persona ayarları başarıyla simüle edildi ve kaydedildi!');
                      }}
                      className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-[10px] uppercase font-bold tracking-wider rounded-xl shadow transition-all cursor-pointer"
                    >
                      Prompt Kalibrasyonunu Kaydet
                    </button>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* 5. STT KEYWORD DIAGNOSTIC PANEL */}
          {adminTab === 'stt-test' && (
            <div className="space-y-6">
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-6">
                
                <div className="flex items-center gap-2 pb-2 border-b border-light-outline">
                  <Mic size={18} className="text-rose-600" />
                  <h2 className="text-lg font-serif font-black text-primary">Ses Girişi Anahtar Kelime Teşhis Testi</h2>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  LGS öğrencilerinden gelen ses kayıtlarındaki kural ve yanılgı eşleşmelerinin teşhis algoritmalarını test edin. Karşılaştırma kelimelerini aşağıya yazarak simülatörü çalıştırın.
                </p>

                <div className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="text-primary block">Simüle Ses Kaydı Transkripti (STT Metni)</label>
                    <input
                      type="text"
                      placeholder="Örn: 'bence üslü sayılarda çarpma işleminde tabanlar aynı olduğunda üstleri çarparız.'"
                      value={testVoiceInput}
                      onChange={(e) => setTestVoiceInput(e.target.value)}
                      className="w-full bg-surface-dim border border-outline rounded-xl p-3.5 focus:outline-none focus:border-primary text-primary font-medium"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTestVoiceInput('üsler aynı iken tabanlar aynı iken çarparız çarparız taban çarpılır');
                      }}
                      className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-[10px] font-bold uppercase transition-all"
                    >
                      Demo Üs Yanılgısı
                    </button>
                    <button
                      onClick={() => {
                        setTestVoiceInput('köklü sayılarda toplama yaparken kök içindekileri topluyorum yani kök üç artı kök beş bence sekiz yapar');
                      }}
                      className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-[10px] font-bold uppercase transition-all"
                    >
                      Demo Kök Yanılgısı
                    </button>
                    <button
                      onClick={() => {
                        setTestVoiceInput('en küçük ortak katta yani ekok formülünde parçaları bir araya getirerek büyük bina dikeceğiz');
                      }}
                      className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-[10px] font-bold uppercase transition-all"
                    >
                      Demo EKOK/EBOB
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={testSTTPromoMatch}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Eşleşme Testi Yap</span>
                    </button>
                  </div>

                  {testOutputResult && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                      <span className="text-[9px] font-black text-emerald-800 block uppercase tracking-widest">Tespit Süzgeci Çıktısı:</span>
                      <p className="text-xs text-emerald-950 font-bold font-serif leading-relaxed">
                        {testOutputResult}
                      </p>
                    </div>
                  )}

                </div>

              </div>
            </div>
          )}

          {/* 6. LOGS STREAM PANEL */}
          {adminTab === 'bulut-log' && (
            <div className="space-y-6">
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-4">
                
                <div className="flex items-center justify-between pb-2 border-b border-light-outline">
                  <div className="flex items-center gap-2">
                    <Server size={18} className="text-indigo-600 animate-pulse" />
                    <h2 className="text-lg font-serif font-black text-primary">Sistem Canlı Günlüğü (System Event Stream)</h2>
                  </div>
                  <button
                    onClick={() => {
                      setLogs([]);
                      addLog('info', 'LOG', 'Olay günlüğü başarıyla temizlendi.');
                    }}
                    className="px-3 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-100 text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                  >
                    Günlüğü Temizle
                  </button>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  EduAi sisteminde gerçekleşen tüm kullanıcı eylemleri, sayfa geçişleri, firestore önbellek sorguları ve veritabanı simülasyonları aşağıda gerçek zamanlı listelenmektedir.
                </p>

                {/* Log terminal */}
                <div className="bg-[#121214] text-neutral-300 rounded-2xl p-5 font-mono text-[11px] leading-relaxed max-h-[460px] overflow-y-auto space-y-2.5 shadow-inner">
                  {logs.length === 0 ? (
                    <span className="text-neutral-500 italic block text-center py-4">Sistemde henüz bir olay tetiklenmedi...</span>
                  ) : (
                    logs.map((log) => {
                      const getLevelColor = (lvl: string) => {
                        switch (lvl) {
                          case 'success': return 'text-emerald-400';
                          case 'warn': return 'text-amber-400';
                          case 'err': return 'text-rose-400';
                          default: return 'text-sky-400';
                        }
                      };

                      return (
                        <div key={log.id} className="border-b border-neutral-900 pb-2 flex gap-3 text-left">
                          <span className="text-neutral-500 shrink-0 select-none">[{log.time}]</span>
                          <span className={`font-black uppercase shrink-0 ${getLevelColor(log.level)}`}>
                            [{log.tag}]
                          </span>
                          <span className="text-neutral-200 font-semibold">{log.msg}</span>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            </div>
          )}

          {/* 7. PDF & RESOURCE MANAGEMENT PANEL FOR ADMIN */}
          {adminTab === 'kaynaklar' && (
            <div className="space-y-6">
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-light-outline">
                  <FolderOpen size={18} className="text-primary" />
                  <h2 className="text-lg font-serif font-black text-primary">PDF ve Kaynak Yönetimi</h2>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                  Öğrencilerin hazırlık havuzunda yer alan ders notlarını, çıkmış LGS sorularını, deneme sınavlarını ve video çözümleri buradan kontrol edebilirsiniz. Yüklediğiniz kaynaklar anlık olarak öğrenci kitaplığına yansır.
                </p>
              </div>
              <ResourcesView isAdminMode={true} />
            </div>
          )}

          {/* 8. DYNAMIC STYLE & THEME MANAGEMENT PANEL */}
          {adminTab === 'stil' && (
            <div className="space-y-6">
              
              {/* Header card */}
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-light-outline">
                  <Palette size={18} className="text-[#ea580c]" />
                  <h2 className="text-lg font-serif font-black text-primary">Sitenin Genel Görünüm ve Stil Yönetimi</h2>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Platformun renk paletini, kenar yuvarlaklıklarını ve tipografi fontlarını doğrudan buradan kalibre edebilirsiniz. Seçtiğiniz ayarlar ya da şablonlar anında tüm site genelinde aktifleşir ve tarayıcı önbelleğine kaydedilir.
                </p>
              </div>

              {/* Theme Presets */}
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-outline pb-2">
                  Hazır Stil &amp; Tema Şablonları (Presets)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Preset 1: Asil Gece */}
                  <div 
                    onClick={() => applyThemePreset('Asil Gece (Klasik Slate)', {
                      primaryColor: '#0f172a',
                      accentColor: '#4f46e5',
                      surfaceColor: '#fdfdfd',
                      surfaceDim: '#f1f5f9',
                      onSurface: '#0f172a',
                      radiusXl: '0.75rem',
                      fontSerif: '"Playfair Display", serif',
                      fontSans: '"Inter", sans-serif'
                    })}
                    className="p-4 bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded-2xl cursor-pointer transition-all hover:shadow-md flex justify-between items-center group"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Asil Gece (Slate default)</h4>
                      <p className="text-[10px] text-slate-500">Koyu lacivert başlıklar, mor vurgular, minimalist modern yaklaşım.</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0 pl-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#0f172a] inline-block border border-black/10" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#4f46e5] inline-block border border-black/10" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#f1f5f9] inline-block border border-black/10" />
                    </div>
                  </div>

                  {/* Preset 2: Zümrüt Şampiyon */}
                  <div 
                    onClick={() => applyThemePreset('Zümrüt Şampiyon (Emerald)', {
                      primaryColor: '#064e3b',
                      accentColor: '#10b981',
                      surfaceColor: '#f8fafc',
                      surfaceDim: '#f0fdf4',
                      onSurface: '#064e3b',
                      radiusXl: '1.25rem',
                      fontSerif: '"Georgia", serif',
                      fontSans: '"Inter", sans-serif'
                    })}
                    className="p-4 bg-emerald-50/50 border border-emerald-100 hover:border-emerald-400 rounded-2xl cursor-pointer transition-all hover:shadow-md flex justify-between items-center group"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-emerald-900 group-hover:text-emerald-700 transition-colors">Zümrüt Şampiyon (Emerald)</h4>
                      <p className="text-[10px] text-emerald-700">Canlandırıcı yeşil tonları, yuvarlatılmış köşeler, üstün motivasyon.</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0 pl-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#064e3b] inline-block border border-black/10" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#10b981] inline-block border border-black/10" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#f0fdf4] inline-block border border-black/10" />
                    </div>
                  </div>

                  {/* Preset 3: Volkanik Turuncu */}
                  <div 
                    onClick={() => applyThemePreset('Volkanik Enerji (Orange)', {
                      primaryColor: '#451a03',
                      accentColor: '#ea580c',
                      surfaceColor: '#fffefb',
                      surfaceDim: '#fef3c7',
                      onSurface: '#451a03',
                      radiusXl: '0.4rem',
                      fontSerif: '"Trebuchet MS", sans-serif',
                      fontSans: '"Inter", sans-serif'
                    })}
                    className="p-4 bg-yellow-50/50 border border-yellow-100 hover:border-amber-500 rounded-2xl cursor-pointer transition-all hover:shadow-md flex justify-between items-center group"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-amber-950 group-hover:text-amber-700 transition-colors">Volkanik Enerji (Warm)</h4>
                      <p className="text-[10px] text-amber-700">Sıcak turuncu detaylar, keskin köşeler, yüksek disiplin vurgusu.</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0 pl-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#451a03] inline-block border border-black/10" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#ea580c] inline-block border border-black/10" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#fef3c7] inline-block border border-black/10" />
                    </div>
                  </div>

                  {/* Preset 4: Derin Kozmos */}
                  <div 
                    onClick={() => applyThemePreset('Mistik Kozmos (Indigo)', {
                      primaryColor: '#1e1b4b',
                      accentColor: '#d946ef',
                      surfaceColor: '#faf8ff',
                      surfaceDim: '#fae8ff',
                      onSurface: '#1e1b4b',
                      radiusXl: '1.75rem',
                      fontSerif: '"Georgia", serif',
                      fontSans: '"JetBrains Mono", monospace'
                    })}
                    className="p-4 bg-purple-50/50 border border-purple-100 hover:border-purple-400 rounded-2xl cursor-pointer transition-all hover:shadow-md flex justify-between items-center group"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-purple-950 group-hover:text-purple-700 transition-colors">Mistik Kozmos (Dinamik)</h4>
                      <p className="text-[10px] text-purple-700">Derin mor arka planlar, pembe neon detaylar ve geniş elips köşeler.</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0 pl-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#1e1b4b] inline-block border border-black/10" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#d946ef] inline-block border border-black/10" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#fae8ff] inline-block border border-black/10" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Individual style customizer controllers */}
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-light-outline">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                    Özel Renk ve Geometri Kalibrasyonları
                  </h3>
                  <button
                    onClick={resetStylesToDefault}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 uppercase tracking-widest cursor-pointer flex items-center gap-1 bg-rose-50 hover:bg-rose-100/55 px-3 py-1.5 rounded-lg border border-rose-100"
                  >
                    <RefreshCw size={10} />
                    <span>Orijinal Defaulta Sıfırla</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Primary Color Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary block">Birincil Başlık ve Metin Rengi (Primary):</label>
                    <div className="flex gap-3">
                      <input 
                        type="color" 
                        value={styleConfig.primaryColor} 
                        onChange={(e) => updateStyleParam('primaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-outline cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={styleConfig.primaryColor} 
                        onChange={(e) => updateStyleParam('primaryColor', e.target.value)}
                        className="flex-1 bg-surface-dim px-3 py-1.5 rounded-xl border border-outline text-xs font-mono font-bold text-primary"
                      />
                    </div>
                    <span className="text-[10px] text-on-surface-variant block leading-relaxed">Başlıklar ve ana butonların arka plan renklerini doğrudan domine eder.</span>
                  </div>

                  {/* Accent Color Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary block">Etkileşim ve Vurgu Rengi (Accent):</label>
                    <div className="flex gap-3">
                      <input 
                        type="color" 
                        value={styleConfig.accentColor} 
                        onChange={(e) => updateStyleParam('accentColor', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-outline cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={styleConfig.accentColor} 
                        onChange={(e) => updateStyleParam('accentColor', e.target.value)}
                        className="flex-1 bg-surface-dim px-3 py-1.5 rounded-xl border border-outline text-xs font-mono font-bold text-primary"
                      />
                    </div>
                    <span className="text-[10px] text-on-surface-variant block leading-relaxed">İkonlar, simgeler ve buton hover aksiyonlarının rengidir.</span>
                  </div>

                  {/* Surface Color Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary block">Kart Temiz Arka Plan Rengi (Surface Bright):</label>
                    <div className="flex gap-3">
                      <input 
                        type="color" 
                        value={styleConfig.surfaceColor} 
                        onChange={(e) => updateStyleParam('surfaceColor', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-outline cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={styleConfig.surfaceColor} 
                        onChange={(e) => updateStyleParam('surfaceColor', e.target.value)}
                        className="flex-1 bg-surface-dim px-3 py-1.5 rounded-xl border border-outline text-xs font-mono font-bold text-primary"
                      />
                    </div>
                    <span className="text-[10px] text-on-surface-variant block leading-relaxed">Sanal kartların ana gövdesi için kullanılan parlak renk tonu.</span>
                  </div>

                  {/* Surface Dim Color Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary block">Sayfa Arka Plan &amp; Çerçeve Rengi (Surface Dim):</label>
                    <div className="flex gap-3">
                      <input 
                        type="color" 
                        value={styleConfig.surfaceDim} 
                        onChange={(e) => updateStyleParam('surfaceDim', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-outline cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={styleConfig.surfaceDim} 
                        onChange={(e) => updateStyleParam('surfaceDim', e.target.value)}
                        className="flex-1 bg-surface-dim px-3 py-1.5 rounded-xl border border-outline text-xs font-mono font-bold text-primary"
                      />
                    </div>
                    <span className="text-[10px] text-on-surface-variant block leading-relaxed">Sayfa ana arka planı ve pasif durum kutusu dolgusudur.</span>
                  </div>

                  {/* Border Radius (Kenarlık Yuvarlaklıkları) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary block">Kenar Köşe Yuvarlaklık Değeri (Radius-Xl):</label>
                    <div className="relative">
                      <select
                        value={styleConfig.radiusXl}
                        onChange={(e) => updateStyleParam('radiusXl', e.target.value)}
                        className="w-full bg-surface-dim px-3 py-2 rounded-xl border border-outline text-xs font-bold text-primary cursor-pointer appearance-none"
                      >
                        <option value="0rem">Keskin (0px)</option>
                        <option value="0.25rem">Hafif Yumuşak (4px)</option>
                        <option value="0.5rem">Orta Oval (8px)</option>
                        <option value="0.75rem">Standart Derin (12px)</option>
                        <option value="1rem">Zengin Kapsayıcı (16px)</option>
                        <option value="1.5rem">Ultra Kapsayıcı (24px)</option>
                        <option value="2rem">Dairesel Elips (32px)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-primary">
                        <Sliders size={12} />
                      </div>
                    </div>
                    <span className="text-[10px] text-on-surface-variant block leading-relaxed">Diyagram, panel ve buton köşelerinin yuvarlanma yoğunluğunu optimize eder.</span>
                  </div>

                  {/* OnSurface (Text On Surface) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary block">Genel Gövde Yazı Rengi (OnSurface):</label>
                    <div className="flex gap-3">
                      <input 
                        type="color" 
                        value={styleConfig.onSurface} 
                        onChange={(e) => updateStyleParam('onSurface', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-outline cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={styleConfig.onSurface} 
                        onChange={(e) => updateStyleParam('onSurface', e.target.value)}
                        className="flex-1 bg-surface-dim px-3 py-1.5 rounded-xl border border-outline text-xs font-mono font-bold text-primary"
                      />
                    </div>
                    <span className="text-[10px] text-on-surface-variant block leading-relaxed">Tüm paragraf ve kılavuz açıklamalarında kullanılan genel metin rengidir.</span>
                  </div>

                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <span className="p-1 px-2.5 h-max rounded-lg bg-amber-500 text-white font-mono text-[10px] font-black uppercase tracking-wider">NOT</span>
                  <p className="text-[10px] text-amber-950 leading-relaxed font-bold">
                    Burada yaptığınız her renk düzenlemesi, tarayıcıda tanımladığımız CSS Custom Variables özellikleri aracılığıyla anlık olarak işlenir. Sitedeki özel butonlar, grafik sınırları ve başlık fontları bu değişkenler aracılığıyla senkronize çalışmaktadır.
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Dynamic Sidebar Info Widget Panel */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white border border-outline rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-outline">
              <Info size={14} className="text-primary" />
              <span>Hızlı Bilgi Havuzu</span>
            </h3>

            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Bu admin paneli, LGS Sözel ve Sayısal Mentor asistan kütüphanenizi tam yetki ile koordine etmenizi sağlar.
            </p>

            <div className="p-3 bg-indigo-50/50 border border-indigo-100 text-indigo-950 rounded-xl space-y-1.5">
              <span className="text-[9px] font-black text-indigo-800 uppercase tracking-widest block">Önemli İpucu</span>
              <span className="text-[10px] leading-normal font-medium block">
                Öğretmek istediğiniz kavram yanılgılarını <strong>"Soru Yönetimi"</strong> sekmesinden ekleyerek asistanın öğrenciyi uyardığı anları anında önizleyebilirsiniz.
              </span>
            </div>

            <div className="pt-2 text-[10px] text-on-surface-variant">
              <p className="font-bold">System Build: v2.4.5</p>
              <p className="mt-0.5">Runtime: Cloud Node.js 20</p>
              <p className="mt-0.5">Region: Europe West 2</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
