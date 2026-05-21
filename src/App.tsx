/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import QuestionArea from './components/QuestionArea';
import AITutor from './components/AITutor';
import AnalysisView from './components/AnalysisView';
import ResourcesView from './components/ResourcesView';
import SettingsView from './components/SettingsView';
import AIGuideView from './components/AIGuideView';
import type { Question, Message, Difficulty, SolveHistory } from './types';
import { useFirebase } from './components/FirebaseContext';
import { getOrCreateUserProfile, getSolveHistories, addSolveHistory } from './lib/db';
import { Sparkles, ShieldCheck, CloudLightning, BookOpen } from 'lucide-react';

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
    errorType: "Kural Karışıklığı"
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
    errorType: "İşlem Hatası"
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
    errorType: "Temel Bilgi Eksiği"
  }
];

export default function App() {
  const { user, loading: authLoading, signInWithGoogle } = useFirebase();
  const [showRegisterPromo, setShowRegisterPromo] = useState(() => {
    try {
      const dismissed = sessionStorage.getItem('lgs_dismiss_register_promo');
      return !dismissed;
    } catch (e) {
      return true;
    }
  });
  const [activeTab, setActiveTab] = useState('calisma');
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(INITIAL_QUESTIONS[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('Hepsi');
  const [correctStreak, setCorrectStreak] = useState(0);
  const [progress, setProgress] = useState(60);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      text: 'Merhaba! Ben senin LGS Matematik mentorun. Üslü sayılar konusunda bugün harika ilerleme kaydediyorsun. Çözemediğin her adımda yanındayım.',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [lastErrorAnalysis, setLastErrorAnalysis] = useState<{ type: string; suggestion: string } | undefined>();
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

  const loadNewQuestion = useCallback(() => {
    setCurrentQuestion(prev => {
      let pool = questions;
      if (difficulty !== 'Hepsi') {
        pool = questions.filter(q => q.difficulty === difficulty);
      }
      if (pool.length === 0) pool = questions;
      
      let finalPool = pool;
      if (prev) {
        finalPool = pool.filter(q => q.id !== prev.id);
        if (finalPool.length === 0) {
          finalPool = pool;
        }
      }
      
      const random = Math.floor(Math.random() * finalPool.length);
      return finalPool[random];
    });
    setLastErrorAnalysis(undefined);
  }, [questions, difficulty]);

  const handleAnswer = (isCorrect: boolean, timeSpentSeconds: number) => {
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

    const formattedTime = timeSpentSeconds > 59 
      ? `${Math.floor(timeSpentSeconds / 60)} dk ${timeSpentSeconds % 60} sn` 
      : `${timeSpentSeconds} saniye`;

    let feedbackTimeText = '';
    if (timeSpentSeconds < 30) {
      feedbackTimeText = ` Bu soruyu sadece ${formattedTime} içerisinde rekor bir hızla çözdün! LGS'de zaman yönetimi açısından mükemmel durumdasın.`;
    } else if (timeSpentSeconds > 90) {
      feedbackTimeText = ` Bu soru üstünde ${formattedTime} harcadın. Sabırla ve odaklanarak sonuna kadar gitmen harika!`;
    } else {
      feedbackTimeText = ` ${formattedTime} çözüm süresi LGS standartlarına göre oldukça dengeli!`;
    }

    if (isCorrect) {
      setCorrectStreak(prev => prev + 1);
      setProgress(prev => Math.min(100, prev + 5));
      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'ai',
        text: `Harika bir çözüm! Mantığı çok iyi kavradın.${feedbackTimeText} Bir sonraki soruya geçmeye hazır mısın?`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
    } else {
      setCorrectStreak(0);
      setLastErrorAnalysis({
        type: currentQuestion.errorType,
        suggestion: currentQuestion.errorAnalysis
      });
      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'ai',
        text: `Yanlış cevap verdin ama sorun değil. Çözüm sürecinde ${formattedTime} harcadın.${feedbackTimeText} Senin için detaylı bir hata analizi hazırladım. "${currentQuestion.errorType}" kısmına dikkat ederek tekrar deneyelim.`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
    }
  };

  const handleHint = () => {
    const hintMsg: Message = {
      id: Date.now().toString(),
      role: 'ai',
      text: currentQuestion.hint,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      isHint: true
    };
    setMessages(prev => [...prev, hintMsg]);
  };

  const handleSendMessage = (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    // Check if this is a speech-to-text concept explanation response
    const isVoiceAnalysis = text.includes('[Zor Kavram Açıklama Analizi]');
    const lowerText = text.toLowerCase();

    // Simulated AI response
    setTimeout(() => {
      let responseText = 'Güzel bir soru! Bu adımda tabanların aynı olduğuna dikkat etmelisin. Eğer tabanlar aynıysa üsleri toplaman yeterli olacaktır.';

      if (isVoiceAnalysis) {
        if (lowerText.includes('üs') && lowerText.includes('çarpma') && (lowerText.includes('çarp') || lowerText.includes('on beş') || lowerText.includes('onbeş'))) {
          responseText = `🎙️ **Ses Kaydı Analizi Yapıldı (Kural Hatası Tespit Edildi!)**

Merhaba! Harika bir çaba, kavramları kendi sesinle açıklaman kalıcı öğrenmenin 1 numaralı sırrıdır! Ancak açıklamanda LGS denemelerinde çok can yakan bir kaza tespit ettim:

❌ **Yanılgı:** "Tabanlar aynıyken üsleri kendi arasında çarparız" dedin ve ve $2^3 \\cdot 2^5 = 2^{15}$ örneğini verdin.

✅ **Gerçek Kural:** Üslü sayılarda çarpma işleminde tabanlar aynı ise **üsler toplanır!** Yani çarpma işleminde üsleri çarpmayız, toplarız:
$$2^3 \\cdot 2^5 = 2^{(3+5)} = 2^8$$

**Mentor Önerisi:** Üsler ancak "üssün üssü" alınırken çarpılır (Örn: $(2^3)^5 = 2^{15}$). Çarpma kuralı ile Üssün Üssü kuralını birbiriyle karıştırmamak için bu akşam soru defterine 3 adet çarpma örneği yazıp çözmeni öneririm!`;
        } else if (lowerText.includes('kök') && lowerText.includes('toplama') && (lowerText.includes('kök iç') || lowerText.includes('sekiz') || lowerText.includes('kök sekiz'))) {
          responseText = `🎙️ **Ses Kaydı Analizi Yapıldı (Temel Bilgi Hatası Tespit Edildi!)**

Ses kaydıyla kavram anlatımı yapman harika bir çalışma! Ancak LGS Matematik sınavlarında öğrencilerin %80'inin düştüğü klasik bir köklü sayı tuzağına düştün:

❌ **Yanılgı:** "Köklü sayılarda toplama yaparken kök içlerindeki sayıları toplayabiliriz" dedin ve $\\sqrt{3} + \\sqrt{5} = \\sqrt{8}$ dedin.

✅ **Gerçek Kural:** Köklü sayılarda toplama veya çıkarma yapabilmek için **kök içlerinin kesinlikle aynı olması gerekir!** Kök içleri aynı değilse işlem aynen kalır, toplanıp tek kök içine yazılamaz:
$$\\sqrt{3} + \\sqrt{5} \\text{ ifadesi daha fazla sadeleşemez.}$$

Ancak kök içleri aynıysa katsayılar toplanır:
$$2\\sqrt{3} + 5\\sqrt{3} = 7\\sqrt{3}$$

**Mentor Önerisi:** Köklü sayıları elmalarla karıştırma! Aynı tür elmalar toplanır ama armut ile elma toplanmaz. Tam kare olmayan sayıları kök dışına çıkarma konusunu bu akşam tekrar gözden geçir!`;
        } else if (lowerText.includes('ebob') && lowerText.includes('ekok') && (lowerText.includes('küçük') || lowerText.includes('bir araya') || lowerText.includes('bina'))) {
          responseText = `🎙️ **Ses Kaydı Analizi Yapıldı (EBOB/EKOK Karışıklığı Tespit Edildi!)**

Kendi kendine sesli açıklama yaparak öğrenmeni test etmen mükemmel bir alışkanlık! Fakat EBOB ile EKOK formüllerinin kullanım yerlerini birbiriyle tam tersi karıştırıyorsun:

❌ **Yanılgı:** "Küçük parçaları bir araya getirip büyük bir bütün oluştururken EBOB kullanılır" dedin.

✅ **Gerçek Kural:**
- **EKOK (En Küçük Ortak Kat):** Küçük parçalar (Örn: tuğlalar, cevizler, saat zilleri, küçük fayanslar) bir araya getirilip daha **büyük bir bütün/kat** oluşturuluyorsa (Parçadan Bütüne) kullanılır. Katlar her zaman büyür.
- **EBOB (En Büyük Ortak Bölen):** Büyük bir bütün (Örn: tarla etrafı, bidsondaki yağlar, büyük kumaşlar) **küçük eşit parçalara** bölünüyorsa (Bütünden Parçaya) kullanılır. Bölenler her zaman küçültür.

**Mentor Önerisi:** Bu pratik formülü aklında tut: "Bütünden parçaya gidiyorsan Bölen (EBOB), parçadan bütüne çıkıyorsan Kat (EKOK)!" Bir sonraki matematik sorusunda bu kuralı doğrudan uygula!`;
        } else {
          responseText = `🎙️ **Ses Kaydı Analizi Yapıldı (Genel Değerlendirme)**

Kendi kelimelerinle yaptığın sesli kavram açıklamasını Google STT motoru üzerinden dinledim! Ses tonundaki kararlılık LGS kampındaki yüksek motivasyonunu gösteriyor.

**Değerlendirme Raporu:**
- Açıklama yaptığın konunun ana hatlarını temel seviyede kurmuşsun.
- Ses analizi eşleşmelerine göre ifade akışın anlaşılır ve doğru terimler içeriyor.

💡 **Hemen Uygula:** Günlük soru çözüm hedefine sadık kalarak, bu konudaki kazanım testlerini ve mentorunun sana sunduğu adım adım ipuçlarını takip etmeye devam et! Sınavlarda yüksek başarıyı yakalayacaksın!`;
        }
      } else {
        // Simple intelligent parsing for written questions
        if (lowerText.includes('üslü') || lowerText.includes('kuvvet')) {
          responseText = 'Harika bir üslü sayı sorusu! LGS\'de üslü sayılarda çarpma kuralını çok sık kullanıyoruz. Eğer tabanlar aynıysa üsleri toplamalısın. Örneğin $2^5 \\cdot 2^3 = 2^8$ olur. Üsler aynı ise tabanları çarpmalısın.';
        } else if (lowerText.includes('köklü') || lowerText.includes.call(lowerText, 'kök')) {
          responseText = 'Köklü sayılar LGS\'de en çok soru gelen konulardan biridir. Tam kare sayıları (1, 4, 9, 16, 25, 36...) ezbere bilmek kök dışına çıkarma işlemlerinde sana çok büyük hız kazandıracaktır.';
        } else if (lowerText.includes('çarpan') || lowerText.includes('kat') || lowerText.includes('asal')) {
          responseText = 'Çarpanlar ve katlar konusunda asal çarpan algoritmasını iyi kullanmalısın. İki sayının çarpımı, o sayıların EBOB\'u ile EKOK\'unun çarpımına eşittir kuralını sakın unutma!';
        }
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1200);
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

    const handleGlobalAskAiMentor = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt: string }>;
      if (customEvent?.detail?.prompt) {
        handleSendMessage(customEvent.detail.prompt);
      }
    };

    window.addEventListener('select_question', handleGlobalSelectQuestion);
    window.addEventListener('select_resource', handleGlobalSelectResource);
    window.addEventListener('ask_ai_mentor', handleGlobalAskAiMentor);

    return () => {
      window.removeEventListener('select_question', handleGlobalSelectQuestion);
      window.removeEventListener('select_resource', handleGlobalSelectResource);
      window.removeEventListener('ask_ai_mentor', handleGlobalAskAiMentor);
    };
  }, [questions]);

  useEffect(() => {
    loadNewQuestion();
  }, [difficulty, loadNewQuestion]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <div className="flex pt-16 flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onUploadClick={handleUploadClick} />
        <main className="flex-1 md:ml-64 mr-0 md:mr-[420px] bg-background">
          {activeTab === 'calisma' && (
            <QuestionArea
              question={currentQuestion}
              onNewQuestion={loadNewQuestion}
              onAnswer={handleAnswer}
              onHint={handleHint}
              selectedDifficulty={difficulty}
              setDifficulty={setDifficulty}
              correctStreak={correctStreak}
            />
          )}
          {activeTab === 'analiz' && <AnalysisView solveHistory={solveHistory} />}
          {activeTab === 'kaynaklar' && <ResourcesView uploadTrigger={resourceUploadTrigger} />}
          {activeTab === 'ai-rehber' && <AIGuideView />}
          {activeTab === 'ayarlar' && <SettingsView solveHistory={solveHistory} />}
        </main>
        <AITutor
          messages={messages}
          onSendMessage={handleSendMessage}
          progress={progress}
          errorAnalysis={lastErrorAnalysis}
        />
      </div>

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
                <span>Yapay Zekalı LGS Sınıfı</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-serif font-black text-primary tracking-tight mb-2">
                LGS Mentor AI ile Dereceye Hazırlan! 🚀
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
                      Çözdüğün tüm üslü sayı soruları, yanlış analizleri ve kazanılan rozetler asla silinmez.
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
                      Yapay zeka asistanı, hedefindeki Kabataş Erkek Lisesi gibi okullara kalan puan mesafeni hedefler.
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

