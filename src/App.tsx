/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import QuestionArea from './components/QuestionArea';
import AnalysisView from './components/AnalysisView';
import ResourcesView from './components/ResourcesView';
import SettingsView from './components/SettingsView';
import AdminView from './components/AdminView';
import MobileAppShell from './components/MobileAppShell';
import AIGuideView from './components/AIGuideView';
import type { Question, Message, Difficulty, SolveHistory } from './types';
import { useFirebase } from './components/FirebaseContext';
import { getOrCreateUserProfile, getSolveHistories, addSolveHistory } from './lib/db';
import { Sparkles, ShieldCheck, CloudLightning, BookOpen } from 'lucide-react';
import { generateLGSQuestions, LGS_SYLLABUS, buildQuestion } from './utils/questionGenerator';

function synchronizeQuestionsWithSyllabus(currentQuestions: Question[], currentSyllabus: typeof LGS_SYLLABUS): Question[] {
  const activeCombinations = currentSyllabus.filter(s => s.subject && s.unit && s.topic);
  
  // Keep questions that still match an active syllabus combination
  let updatedPool = currentQuestions.filter(q => {
    return activeCombinations.some(item => 
      q.subject === item.subject && 
      q.unit === item.unit && 
      q.topic === item.topic
    );
  });

  // Find combinations in the syllabus that currently have 0 questions
  for (const item of activeCombinations) {
    const hasQs = updatedPool.some(q => 
      q.subject === item.subject && 
      q.unit === item.unit && 
      q.topic === item.topic
    );

    if (!hasQs) {
      // Automatically generate 20 questions for this mismatch/new combination
      for (let i = 1; i <= 20; i++) {
        const difficulty: Difficulty = i <= 6 ? 'Kolay' : i <= 14 ? 'Orta' : 'Zor';
        const subjectPrefix = (item.subject || 'GEN').substring(0, 3).toUpperCase();
        const topicSuffix = (item.topic || 'TOP').replace(/\s+/g, '').substring(0, 5).toUpperCase();
        const qId = `AUTO-${subjectPrefix}-${topicSuffix}-${100 + i}`;
        
        const q = buildQuestion(item.subject, item.unit, item.topic, i, difficulty, qId);
        updatedPool.push(q);
      }
    }
  }

  return updatedPool;
}

const INITIAL_QUESTIONS: Question[] = [
  {
    id: "42",
    difficulty: "Orta",
    text: "Bir veri depolama merkezinde bulunan sunucuların kapasiteleri 2'nin ve 5'in kuvvetleri şeklinde düzenlenmiştir. A tipi bir sunucunun kapasitesi 2¹⁰ GB, B tipi bir sunucunun kapasitesi ise 5⁴ GB'tır.",
    context: '"Merkezde 25 adet A tipi sunucu ve 16 adet B tipi sunucu bulunmaktadır."',
    query: "Buna göre bu veri merkezindeki toplam depolama kapasitesi kaç GB'tır?",
    options: [
      { label: "A", value: "10⁶", isCorrect: true },
      { label: "B", value: "2 · 10⁶", isCorrect: false },
      { label: "C", value: "10¹⁰", isCorrect: false },
      { label: "D", value: "2¹⁴ · 5⁸", isCorrect: false }
    ],
    hint: "25 sayısını 5'in kuvveti olarak (5²) ve 16 sayısını 2'nin kuvveti olarak (2⁴) yazıp üsleri birleştirmeyi dene.",
    errorAnalysis: "Muhtemelen toplama yaparken üsleri birleştirmek yerine doğrudan sayıları toplamaya çalıştın. Üslü sayılarda çarpma kuralını (tabanlar aynıysa üsler toplanır) kontrol etmelisin.",
    errorType: "Kural Karışıklığı",
    subject: "Matematik",
    unit: "Üslü İfadeler",
    topic: "Üslü Sayılarda Çarpma"
  },
  {
    id: "87",
    difficulty: "Zor",
    text: "Dünya'nın Güneş'e olan uzaklığı yaklaşık 1,5 · 10⁸ kilometredir. Işık hızı ise saniyede yaklaşık 3 · 10⁵ kilometredir.",
    context: '"Işığın bir noktadan diğerine ulaşma süresi Yol / Hız formülü ile hesaplanır."',
    query: "Buna göre Güneş ışığı Dünya'ya yaklaşık kaç saniyede ulaşır?",
    options: [
      { label: "A", value: "5", isCorrect: false },
      { label: "B", value: "50", isCorrect: false },
      { label: "C", value: "500", isCorrect: true },
      { label: "D", value: "5000", isCorrect: false }
    ],
    hint: "1,5 · 10⁸ sayısını 3 · 10⁵ sayısına bölerken katsayıları kendi arasında, üslüleri kendi arasında böl.",
    errorAnalysis: "Bölme işleminde üsleri çıkarırken hata yapmış olabilirsin. 10⁸ / 10⁵ = 10³ olduğunu unutma.",
    errorType: "İşlem Hatası",
    subject: "Matematik",
    unit: "Üslü İfadeler",
    topic: "Bilimsel Gösterim"
  },
  {
    id: "12",
    difficulty: "Kolay",
    text: "2³ · 2⁵ işleminin sonucu aşağıdakilerden hangisine eşittir?",
    context: '"Üslü ifadelerde çarpma işlemi yapılırken tabanlar aynı ise üsler toplanır."',
    query: "Verilen kuralı uygulayarak sonucu bulunuz.",
    options: [
      { label: "A", value: "2⁸", isCorrect: true },
      { label: "B", value: "2¹⁵", isCorrect: false },
      { label: "C", value: "4⁸", isCorrect: false },
      { label: "D", value: "2²", isCorrect: false }
    ],
    hint: "Tabanlar her iki ifadede de 2. Üsleri (3 ve 5) toplaman yeterli olacaktır.",
    errorAnalysis: "Üsleri toplamak yerine çarpmış olabilirsin (3x5=15). Temel kuralları tekrar gözden geçirelim.",
    errorType: "Temel Bilgi Eksiği",
    subject: "Matematik",
    unit: "Üslü İfadeler",
    topic: "Üslü Sayılarda Çarpma"
  },
  {
    id: "101",
    difficulty: "Kolay",
    text: "Aşağıdaki cümlelerin hangisinde 'keskin' sözcüğü mecaz anlamda kullanılmıştır?",
    context: '"Bir sözcüğün gerçek anlamından tamamen uzaklaşarak kazandığı yeni anlama mecaz anlam denir."',
    query: "Buna göre cümleleri inceleyerek mecaz anlamlı seceneği bulunuz.",
    options: [
      { label: "A", value: "Masanın üzerindeki keskin bıçağı kaldır.", isCorrect: false },
      { label: "B", value: "Onun bu keskin zekası herkesi hayran bıraktı.", isCorrect: true },
      { label: "C", value: "Biberin çok keskin bir kokusu vardı.", isCorrect: false },
      { label: "D", value: "Ayağına batan keskin taşı hemen fırlattı.", isCorrect: false }
    ],
    hint: "'Keskin' sözcüğü normalde kesici aletler için kullanılır. Zeka veya koku ile kullanıldığında bu özellik gerçek dışıdır.",
    errorAnalysis: "Gerçek anlamda dokunma veya görme duyularıyla hissedilen fiziki kesicilik kastedilir. Zeka fiziki olarak kesici olamayacağı için mecazdır.",
    errorType: "Sözcük Grubu Karışıklığı",
    subject: "Türkçe",
    unit: "Sözcükte Anlam",
    topic: "Gerçek ve Mecaz Anlam"
  },
  {
    id: "202",
    difficulty: "Orta",
    text: "Eğiklik açısı 23° 27' olan Dünya'nın eksen eğikliği ve Güneş etrafındaki dolanma hareketi sonucu mevsimler oluşur.",
    context: '"21 Haziran tarihinde Kuzey Yarım Küre\'de yaz mevsimi başlangıcı yaşanırken Güney Yarım Küre\'de ise kış mevsimi başlar."',
    query: "Buna göre en uzun gündüzün Kuzey Yarım Küre'de yaşandığı tarih aşağıdakilerden hangisidir?",
    options: [
      { label: "A", value: "21 Mart", isCorrect: false },
      { label: "B", value: "21 Haziran", isCorrect: true },
      { label: "C", value: "23 Eylül", isCorrect: false },
      { label: "D", value: "21 Aralık", isCorrect: false }
    ],
    hint: "Yaz mevsiminin başladığı ve güneş ışınlarının en dik geldiği gün en uzun gündüz yaşanır.",
    errorAnalysis: "En uzun gündüzün Kuzey Yarım Küre için 21 Haziran (Yaz Gündönümü) olduğunu unutmuş olabilirsiniz.",
    errorType: "Bilgi Eksiği",
    subject: "Fen Bilimleri",
    unit: "Mevsimler ve İklim",
    topic: "Mevsimlerin Oluşumu"
  },
  {
    id: "303",
    difficulty: "Orta",
    text: "Bir limandan kalkan iki farklı gemiden biri 12 saatte bir, diğeri ise 15 saatte bir sefer yapmaktadır.",
    context: '"İki gemi aynı anda sefer çıktıktan sonra tekrar ilk kez birlikte çıkacakları zaman hesaplanacaktır."',
    query: "Buna göre bu iki gemi en az kaç saat sonra tekrar birlikte sefere çıkarlar?",
    options: [
      { label: "A", value: "3", isCorrect: false },
      { label: "B", value: "30", isCorrect: false },
      { label: "C", value: "60", isCorrect: true },
      { label: "D", value: "120", isCorrect: false }
    ],
    hint: "12 ve 15 sayılarının en küçük ortak katını (EKOK) bulmalısın.",
    errorAnalysis: "Bu soruda bütüne gitmek istendiği için EKOK alınmalıdır. En küçük ortak katı 60'tır.",
    errorType: "EBOB / EKOK Karışıklığı",
    subject: "Matematik",
    unit: "Çarpanlar ve Katlar",
    topic: "EBOB - EKOK Problemleri"
  }
];

export default function App() {
  const { user, loading: authLoading, signInWithGoogle } = useFirebase();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showRegisterPromo, setShowRegisterPromo] = useState(() => {
    try {
      const dismissed = sessionStorage.getItem('lgs_dismiss_register_promo');
      return !dismissed;
    } catch (e) {
      return true;
    }
  });
  const [activeTab, setActiveTab] = useState('calisma');

  // Dynamic Theme/Style Customization apply effect
  useEffect(() => {
    const applyDynamicTheme = () => {
      const savedTheme = localStorage.getItem('lgs_theme_config');
      if (savedTheme) {
        try {
          const config = JSON.parse(savedTheme);
          const root = document.documentElement;
          if (config.primaryColor) root.style.setProperty('--color-primary', config.primaryColor);
          if (config.accentColor) root.style.setProperty('--color-accent', config.accentColor);
          if (config.surfaceColor) root.style.setProperty('--color-surface', config.surfaceColor);
          if (config.surfaceDim) root.style.setProperty('--color-surface-dim', config.surfaceDim);
          if (config.onSurface) root.style.setProperty('--color-on-surface', config.onSurface);
          if (config.radiusXl) root.style.setProperty('--radius-xl', config.radiusXl);
          if (config.fontSerif) {
            root.style.setProperty('--font-serif', config.fontSerif);
          }
          if (config.fontSans) {
            root.style.setProperty('--font-sans', config.fontSans);
          }
        } catch (err) {
          console.error('Failed to parse dynamic theme configuration:', err);
        }
      } else {
        const root = document.documentElement;
        root.style.removeProperty('--color-primary');
        root.style.removeProperty('--color-accent');
        root.style.removeProperty('--color-surface');
        root.style.removeProperty('--color-surface-dim');
        root.style.removeProperty('--color-on-surface');
        root.style.removeProperty('--radius-xl');
        root.style.removeProperty('--font-serif');
        root.style.removeProperty('--font-sans');
      }
    };

    applyDynamicTheme();
    window.addEventListener('storage', applyDynamicTheme);
    window.addEventListener('theme-changed', applyDynamicTheme);
    return () => {
      window.removeEventListener('storage', applyDynamicTheme);
      window.removeEventListener('theme-changed', applyDynamicTheme);
    };
  }, []);

  const [syllabus, setSyllabus] = useState<{ subject: string; unit: string; topic: string }[]>(() => {
    const saved = localStorage.getItem('lgs_custom_syllabus') || localStorage.getItem('lgs_published_syllabus');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return LGS_SYLLABUS;
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    // 1. Get current active syllabus
    const savedSyllabusStr = localStorage.getItem('lgs_custom_syllabus') || localStorage.getItem('lgs_published_syllabus');
    let activeSyllabus = LGS_SYLLABUS;
    if (savedSyllabusStr) {
      try {
        const parsed = JSON.parse(savedSyllabusStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          activeSyllabus = parsed;
        }
      } catch (e) {}
    }

    // 2. Try loading from lgs_questions_pool first, as it holds all edited/published/injected/created questions
    let pool: Question[] = [];
    const savedPool = localStorage.getItem('lgs_questions_pool');
    if (savedPool) {
      try {
        const parsed = JSON.parse(savedPool);
        if (Array.isArray(parsed) && parsed.length > 0) {
          pool = parsed;
        }
      } catch (e) {
        console.error('Failed to parse lgs_questions_pool:', e);
      }
    }

    if (pool.length === 0) {
      pool = generateLGSQuestions();
    }

    // 3. Synchronize questions pool with current active syllabus configurations
    const synchronized = synchronizeQuestionsWithSyllabus(pool, activeSyllabus);
    localStorage.setItem('lgs_questions_pool', JSON.stringify(synchronized));
    return synchronized;
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question>(() => {
    return questions[0] || INITIAL_QUESTIONS[0];
  });

  const [difficulty, setDifficulty] = useState<Difficulty>('Hepsi');
  const [correctStreak, setCorrectStreak] = useState(0);
  const [progress, setProgress] = useState(60);
  const [isFocusMode, setIsFocusMode] = useState(true);
  const [isSolving, setIsSolving] = useState(false);

  // Lesson, Unit, Topic Cascade Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('Hepsi');
  const [selectedUnit, setSelectedUnit] = useState<string>('Hepsi');
  const [selectedTopic, setSelectedTopic] = useState<string>('Hepsi');

  const [solveHistory, setSolveHistory] = useState<SolveHistory[]>(() => {
    const saved = localStorage.getItem('lgs_solve_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { questionId: "12", isCorrect: true, timeSpent: 42, difficulty: "Kolay" },
      { questionId: "42", isCorrect: true, timeSpent: 75, difficulty: "Orta" },
      { questionId: "87", isCorrect: false, timeSpent: 125, difficulty: "Zor" }
    ];
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      text: 'EduSınav Soru Bankası ve Test Çözme sistemine hoş geldiniz.',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    localStorage.setItem('lgs_solve_history', JSON.stringify(solveHistory));
  }, [solveHistory]);

  // Load from Firebase when authenticated, and sync
  useEffect(() => {
    if (!user) return;

    const syncUserData = async () => {
      try {
        const localSettingsRaw = localStorage.getItem('lgs_settings');
        const defaultSettings = localSettingsRaw ? JSON.parse(localSettingsRaw) : {
          name: user.displayName || 'Deniz Yılmaz',
          targetSchool: 'Kabataş Erkek Lisesi',
          dailyGoal: 50,
          avatarSeed: 'Felix',
          notifySms: true,
          notifyDaily: true,
          notifyAiMentorship: true,
          notifyTime: '18:30',
          membershipType: 'Standart'
        };
        const fbSettings = await getOrCreateUserProfile(user.uid, defaultSettings);
        localStorage.setItem('lgs_settings', JSON.stringify(fbSettings));
        window.dispatchEvent(new Event('storage'));

        // Load solve history
        const fbHistory = await getSolveHistories(user.uid);
        if (fbHistory && fbHistory.length > 0) {
          setSolveHistory(fbHistory);
        } else {
          // Sync current local solve history to Firebase
          for (const item of solveHistory) {
            await addSolveHistory(user.uid, item);
          }
        }
      } catch (err) {
        console.error("Firestore user sync error:", err);
      }
    };

    syncUserData();
  }, [user]);

  // Auto-switch to first question when filters change to start at question 1, and sanitize selected variables
  useEffect(() => {
    let activeSubject = selectedSubject;
    let activeUnit = selectedUnit;
    let activeTopic = selectedTopic;

    // Check if selectedSubject is still valid in syllabus
    if (selectedSubject !== 'Hepsi') {
      const exists = syllabus.some(s => s.subject === selectedSubject);
      if (!exists) {
        activeSubject = 'Hepsi';
        activeUnit = 'Hepsi';
        activeTopic = 'Hepsi';
        setSelectedSubject('Hepsi');
        setSelectedUnit('Hepsi');
        setSelectedTopic('Hepsi');
      }
    }

    if (activeSubject !== 'Hepsi' && activeUnit !== 'Hepsi') {
      const exists = syllabus.some(s => s.subject === activeSubject && s.unit === activeUnit);
      if (!exists) {
        activeUnit = 'Hepsi';
        activeTopic = 'Hepsi';
        setSelectedUnit('Hepsi');
        setSelectedTopic('Hepsi');
      }
    }

    if (activeSubject !== 'Hepsi' && activeUnit !== 'Hepsi' && activeTopic !== 'Hepsi') {
      const exists = syllabus.some(s => s.subject === activeSubject && s.unit === activeUnit && s.topic === activeTopic);
      if (!exists) {
        activeTopic = 'Hepsi';
        setSelectedTopic('Hepsi');
      }
    }

    let pool = questions;
    if (difficulty !== 'Hepsi') {
      pool = pool.filter(q => q.difficulty === difficulty);
    }
    if (activeSubject !== 'Hepsi') {
      pool = pool.filter(q => q.subject === activeSubject);
    }
    if (activeUnit !== 'Hepsi') {
      pool = pool.filter(q => q.unit === activeUnit);
    }
    if (activeTopic !== 'Hepsi') {
      pool = pool.filter(q => q.topic === activeTopic);
    }
    
    if (pool.length > 0) {
      setCurrentQuestion(pool[0]);
    }
  }, [selectedSubject, selectedUnit, selectedTopic, difficulty, questions, syllabus]);

  const loadNewQuestion = useCallback(() => {
    setCurrentQuestion(prev => {
      let pool = questions;
      
      // Apply difficulty filter
      if (difficulty !== 'Hepsi') {
        pool = pool.filter(q => q.difficulty === difficulty);
      }
      // Apply Subject Cascade Filter
      if (selectedSubject !== 'Hepsi') {
        pool = pool.filter(q => q.subject === selectedSubject);
      }
      // Apply Unit Cascade Filter
      if (selectedUnit !== 'Hepsi') {
        pool = pool.filter(q => q.unit === selectedUnit);
      }
      // Apply Topic Cascade Filter
      if (selectedTopic !== 'Hepsi') {
        pool = pool.filter(q => q.topic === selectedTopic);
      }
      
      if (pool.length === 0) {
        // Fallback to active subject if possible to avoid empty screens
        let fallbackPool = questions;
        if (selectedSubject !== 'Hepsi') {
          fallbackPool = fallbackPool.filter(q => q.subject === selectedSubject);
        }
        pool = fallbackPool.length > 0 ? fallbackPool : questions;
      }
      
      let nextIndex = 0;
      if (prev) {
        const idx = pool.findIndex(q => q.id === prev.id);
        if (idx !== -1 && idx + 1 < pool.length) {
          nextIndex = idx + 1;
        } else {
          nextIndex = 0; // Wraps around once the bank is fully completed
        }
      }
      
      return pool[nextIndex] || questions[0];
    });
  }, [questions, difficulty, selectedSubject, selectedUnit, selectedTopic]);

  const handleAnswer = (isCorrect: boolean, timeSpentSeconds: number) => {
    if (!currentQuestion) return;
    
    // Save to solve history
    const newSolve: SolveHistory = {
      questionId: currentQuestion.id,
      isCorrect,
      timeSpent: timeSpentSeconds,
      difficulty: currentQuestion.difficulty
    };
    setSolveHistory(prev => [...prev, newSolve]);

    if (user) {
      addSolveHistory(user.uid, newSolve).catch(e => {
        console.error("Firestore solve history write error:", e);
      });
    }

    if (isCorrect) {
      setCorrectStreak(prev => prev + 1);
      setProgress(prev => Math.min(100, prev + 5));
    } else {
      setCorrectStreak(0);
    }
  };

  const [resourceUploadTrigger, setResourceUploadTrigger] = useState(0);

  const handleUploadClick = () => {
    setActiveTab('kaynaklar');
    setResourceUploadTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const handleGlobalSelectQuestion = (e: Event) => {
      const customEvent = e as CustomEvent<{ questionId: string }>;
      if (customEvent?.detail?.questionId) {
        const found = questions.find(q => q.id === customEvent.detail.questionId);
        if (found) {
          setCurrentQuestion(found);
          setActiveTab('calisma');
        }
      }
    };

    const handleGlobalSelectResource = (e: Event) => {
      const customEvent = e as CustomEvent<{ fileId: string }>;
      if (customEvent?.detail?.fileId) {
        setActiveTab('kaynaklar');
      }
    };

    window.addEventListener('select_question', handleGlobalSelectQuestion);
    window.addEventListener('select_resource', handleGlobalSelectResource);

    return () => {
      window.removeEventListener('select_question', handleGlobalSelectQuestion);
      window.removeEventListener('select_resource', handleGlobalSelectResource);
    };
  }, [questions]);

  // Listen for syllabus updates to dynamically reload/synchronize the questions
  useEffect(() => {
    const handleSyllabusUpdate = () => {
      // 1. Load active syllabus and update state
      const savedSyllabusStr = localStorage.getItem('lgs_custom_syllabus') || localStorage.getItem('lgs_published_syllabus');
      let activeSyllabus = LGS_SYLLABUS;
      if (savedSyllabusStr) {
        try {
          const parsed = JSON.parse(savedSyllabusStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            activeSyllabus = parsed;
          }
        } catch (e) {}
      }
      setSyllabus(activeSyllabus);

      // 2. Load questions
      const savedPool = localStorage.getItem('lgs_questions_pool');
      let currentPool: Question[] = [];
      if (savedPool) {
        try {
          const parsed = JSON.parse(savedPool);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentPool = parsed;
          }
        } catch (e) {
          console.error('Failed to parse updated questions pool:', e);
        }
      }

      if (currentPool.length === 0) {
        currentPool = generateLGSQuestions();
      }

      // 3. Synchronize questions with the active syllabus
      const synchronized = synchronizeQuestionsWithSyllabus(currentPool, activeSyllabus);
      setQuestions(synchronized);
      localStorage.setItem('lgs_questions_pool', JSON.stringify(synchronized));

      // Check if a question bank is currently selected, and sync filters to it
      const bankId = localStorage.getItem('lgs_selected_bank_id');
      if (bankId) {
        const savedBanksStr = localStorage.getItem('lgs_question_banks');
        if (savedBanksStr) {
          try {
            const banks = JSON.parse(savedBanksStr);
            if (Array.isArray(banks)) {
              const activeBank = banks.find(b => b.id === bankId);
              if (activeBank) {
                setDifficulty('Hepsi');
                setSelectedSubject(activeBank.subject);
                setSelectedUnit(activeBank.unit);
                setSelectedTopic(activeBank.topic);
                
                // Set current question to the first question of this bank
                const bankQuestions = synchronized.filter(q => 
                  q.subject === activeBank.subject &&
                  q.unit === activeBank.unit &&
                  q.topic === activeBank.topic
                );
                if (bankQuestions.length > 0) {
                  setCurrentQuestion(bankQuestions[0]);
                }
                return;
              }
            }
          } catch (e) {
            console.error('Failed to sync filters on syllabus bank update:', e);
          }
        }
      }

      // Falls back to resetting to Hepsi if no specific bank is active
      setSelectedSubject('Hepsi');
      setSelectedUnit('Hepsi');
      setSelectedTopic('Hepsi');
    };

    window.addEventListener('storage', handleSyllabusUpdate);
    window.addEventListener('theme-changed', handleSyllabusUpdate);
    window.addEventListener('lgs_syllabus_updated', handleSyllabusUpdate);

    return () => {
      window.removeEventListener('storage', handleSyllabusUpdate);
      window.removeEventListener('theme-changed', handleSyllabusUpdate);
      window.removeEventListener('lgs_syllabus_updated', handleSyllabusUpdate);
    };
  }, [questions]);

  if (activeTab === 'admin') {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header 
          onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />
        <div className="flex pt-16 flex-1">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onUploadClick={handleUploadClick} 
            isMobileOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />
          <main className="flex-1 md:ml-64 mr-0 bg-background z-10 flex flex-col">
            <AdminView
              questions={questions}
              setQuestions={setQuestions}
              solveHistory={solveHistory}
              setSolveHistory={setSolveHistory}
              correctStreak={correctStreak}
              setCorrectStreak={setCorrectStreak}
              progress={progress}
              setProgress={setProgress}
              messages={messages}
              setMessages={setMessages}
              currentQuestion={currentQuestion}
              setCurrentQuestion={setCurrentQuestion}
            />
          </main>
        </div>
      </div>
    );
  }

  const isFocusActive = isFocusMode && activeTab === 'calisma' && isSolving;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <MobileAppShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        correctStreak={correctStreak}
        isFocusActive={isFocusActive}
      >
        {activeTab === 'calisma' && currentQuestion && (
          <QuestionArea
            question={currentQuestion}
            questions={questions}
            syllabus={syllabus}
            onNewQuestion={loadNewQuestion}
            onAnswer={handleAnswer}
            selectedDifficulty={difficulty}
            setDifficulty={setDifficulty}
            correctStreak={correctStreak}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            selectedUnit={selectedUnit}
            setSelectedUnit={setSelectedUnit}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            solveHistory={solveHistory}
            onSelectQuestion={setCurrentQuestion}
            isFocusMode={isFocusMode}
            setIsFocusMode={setIsFocusMode}
            onFocusStateChange={setIsSolving}
          />
        )}
        {activeTab === 'analiz' && (
          <AnalysisView 
            solveHistory={solveHistory} 
            questions={questions}
            syllabus={syllabus}
          />
        )}
        {activeTab === 'mentor' && (
          <AIGuideView 
            solveHistory={solveHistory} 
            questions={questions}
          />
        )}
        {activeTab === 'kaynaklar' && <ResourcesView uploadTrigger={resourceUploadTrigger} />}
        {activeTab === 'ayarlar' && <SettingsView solveHistory={solveHistory} />}
      </MobileAppShell>

      {/* Modern, High-Conversion Google Sign-Up & Onboarding Modal */}
      {!user && showRegisterPromo && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-300">
          <div className="bg-white rounded-3xl border border-outline w-full max-w-lg overflow-hidden shadow-2xl flex flex-col relative animate-scale-up duration-300 transform">
            
            {/* Elegant Header Accent */}
            <div className="h-2.5 bg-gradient-to-r from-primary via-primary-hover to-purple-600 w-full" />
            
            {/* Close button */}
            <button 
              onClick={() => {
                sessionStorage.setItem('lgs_dismiss_register_promo', 'true');
                setShowRegisterPromo(false);
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              title="Misafir Olarak Devam Et"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content area */}
            <div className="p-8 pb-6 flex-1 flex flex-col text-center">
              
              {/* Star Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-wider mx-auto mb-4 border border-primary/15 animate-bounce">
                <Sparkles size={11} className="text-primary" />
                <span>EduSınav LGS Çalışma Alanı</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-serif font-black text-primary tracking-tight mb-2">
                EduSınav ile Dereceye Hazırlan! 🚀
              </h2>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto mb-6 leading-relaxed">
                Platformumuzun tüm kişiselleştirilmiş analizlerini ve çalışma kütüphanesini bulut güvencesi ile kullanın.
              </p>

              {/* Value Propositions */}
              <div className="space-y-4 text-left mb-8 max-w-sm mx-auto">
                {/* Prop 1 */}
                <div className="flex gap-3.5 items-start">
                  <div className="mt-0.5 p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 border border-emerald-100">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-primary">Bulut Yedeklemesi & Senkronizasyon</h3>
                    <p className="text-[11px] text-on-surface-variant leading-tight">
                      Çözdüğün tüm LGS soruları, yanlış analizleri ve gelişim istatistikleri asla silinmez.
                    </p>
                  </div>
                </div>

                {/* Prop 2 */}
                <div className="flex gap-3.5 items-start">
                  <div className="mt-0.5 p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 border border-blue-100">
                    <CloudLightning size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-primary">Kişiselleştirilmiş PDF Kütüphanesi</h3>
                    <p className="text-[11px] text-on-surface-variant leading-tight">
                      Kendi yüklediğin LGS ders notları ve soru PDF'leri her cihazdan anında erişilebilir olur.
                    </p>
                  </div>
                </div>

                {/* Prop 3 */}
                <div className="flex gap-3.5 items-start">
                  <div className="mt-0.5 p-1.5 bg-purple-50 text-purple-600 rounded-lg shrink-0 border border-purple-100">
                    <BookOpen size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-primary">Detaylı Gelişim Grafikleri</h3>
                    <p className="text-[11px] text-on-surface-variant leading-tight">
                      Sistemimiz çözdüğün ders, ünite ve konu dağılımlarını takip ederek eksik kalan yerlerini listeler.
                    </p>
                  </div>
                </div>
              </div>

              {/* Main CTA: Google Authentication Button */}
              <button
                onClick={() => {
                  signInWithGoogle().then(u => {
                    if (u) {
                      setShowRegisterPromo(false);
                      alert(`Tebrikler ${u.displayName}! Google ile kaydın başarıyla aktive edildi. Tüm ilerlemen kaydediliyor.`);
                    }
                  });
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 hover:shadow-xl cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              >
                {/* Clean inline SVG G-logo */}
                <svg className="w-4 h-4 text-white shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.102C18.22 1.43 15.44 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.405-.18-1.925H12.24z"/>
                </svg>
                <span>Google ile Kayıt Ol / Giriş Yap</span>
              </button>

            </div>

            {/* Optional humble footer */}
            <div className="px-8 py-4 bg-neutral-50 border-t border-outline flex items-center justify-between text-[10px] text-on-surface-variant/80">
              <span className="font-medium">Hesap açmak tamamen ücretsizdir.</span>
              <button
                onClick={() => {
                  sessionStorage.setItem('lgs_dismiss_register_promo', 'true');
                  setShowRegisterPromo(false);
                }}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                Misafir Olarak Devam Et &rarr;
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
