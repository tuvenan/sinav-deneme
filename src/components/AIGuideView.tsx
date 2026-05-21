import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bot, 
  Lightbulb, 
  MessageSquare, 
  Sparkles, 
  Zap, 
  ChevronLeft, 
  BookOpen, 
  Award, 
  Compass, 
  CheckCircle2, 
  ListTodo, 
  ArrowRight, 
  Clock, 
  Activity, 
  FileText, 
  Check, 
  RotateCcw,
  User,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from './FirebaseContext';
import { addLgsWeeklyCampToCalendar } from '../lib/googleCalendar';
import { Calendar as CalendarIcon } from 'lucide-react';

// Pre-loaded LGS Step-by-Step Questions
const SAMPLE_QUESTIONS = [
  {
    id: 'sample-1',
    title: 'Üslü Sayılar - Çevre Hesabı (LGS Tarzı)',
    text: 'Bir kenar uzunluğu 2⁵ mm olan kare şeklindeki 8 adet karton yan yana birleştirilerek tek sıra halinde bir dikdörtgen elde ediliyor.',
    query: 'Buna göre elde edilen bu dikdörtgenin çevre uzunluğu kaç mm\'dir?',
    steps: [
      {
        title: 'Adım 1: Geometrik Yapıyı Modelleme',
        desc: '8 tane kare yan yana dizildiğinde; yan yana birleşen iç kenarlar dışarıdan görünmez. Dikdörtgenin üst tarafında 8 kenar, alt tarafında 8 kenar, sol tarafında 1 kenar ve sağ tarafında 1 kenar olmak üzere dışarıda kalan toplam kare kenarı sayısı: 8 + 8 + 1 + 1 = 18 adettir.',
        formula: 'Toplam Kenar Sayısı = 18 adet kare kenarı.'
      },
      {
        title: 'Adım 2: Çevre Formülünü Kurma',
        desc: 'Bir kenar uzunluğu bize 2⁵ mm olarak verilmişti. Çevre, dışarıda kalan tüm kenarların toplamı olduğuna göre, bunu matematiksel olarak ifade edelim:',
        formula: 'Çevre = 18 · 2⁵ mm'
      },
      {
        title: 'Adım 3: Üslü ve Taban Dönüşümü İşlemi',
        desc: 'LGS sınavında şıklarda genellikle tabanlar 2\'nin veya 10\'un kuvvetleri şeklinde düzenlenir. Çarpımı kolayca sadeleştirmek için 18 sayısını asal çarpanlarına ayıralım: 18 = 2 · 9 = 2 · 3². Şimdi formülde yerine koyalım:',
        formula: 'Çv = (2¹ · 3²) · 2⁵ = 3² · (2¹ · 2⁵) = 9 · 2⁶ mm olarak bulunur.'
      },
      {
        title: 'Adım 4: LGS Şampiyon Püf Noktası',
        desc: 'LGS sınavında bu sorudaki gibi birleşme mantığı sorulurken en sık yapılan hata, karton sayısıyla çevre kenar sayısını doğrudan çarpmaktır (örneğin 8 x 4 = 32 kenar almak). Unutma, kareler yan yana yapıştığında 7 kenar çifti (yani 14 kenar) içeride kalır ve çevreye dahil edilmez!',
        formula: 'Her zaman dış çerçeveyi saymayı kendine ilke edin!'
      }
    ]
  },
  {
    id: 'sample-2',
    title: 'Köklü Sayılar - Tel Kesme ve Parçalama (Kritik Soru)',
    text: '√180 metre uzunluğundaki bir tel, her birinin uzunluğu √5 metre olan eş parçalara ayrılacaktır.',
    query: 'Buna göre teli bu parçalara ayırmak için kaç kesme işlemi yapılması gerekir?',
    steps: [
      {
        title: 'Adım 1: Sayıları Kök Dışına Çıkarma',
        desc: '√180 ve √5 sayılarını işlem yapabilmek için a√b biçiminde yazmalıyız. 180 sayısını tam kare çarpanlarına ayıralım: 180 = 36 · 5. Buradan:',
        formula: '√180 = √(36 · 5) = 6√5 metredir.'
      },
      {
        title: 'Adım 2: Parça Sayısını Bulma',
        desc: 'Telin tamamı 6√5 metre olduğuna ve her bir parça √5 metre uzunluğunda olacağına göre, toplam parça sayısını bölme işlemi yaparak buluruz:',
        formula: 'Parça Sayısı = Telin Boyu / Parçanın Boyu = 6√5 / √5 = 6 parça.'
      },
      {
        title: 'Adım 3: LGS Kesim Sayısı Tuzağı',
        desc: 'LGS sınavını hazırlayan komisyonun en sevdiği çeldirici buradadır! 6 parça elde etmek için kaç defa kesme işlemi uygulamalıyız? 1 adet düz teli 1 kere keserseniz 2 parça olur, 2 kere keserseniz 3 parça olur. Yani parça sayısı her zaman kesim sayısından 1 fazladır!',
        formula: 'Kesim Sayısı = Parça Sayısı - 1 = 6 - 1 = 5 kesim.'
      },
      {
        title: 'Adım 4: Sonuç ve Seçenek Kontrolü',
        desc: 'Cevap seçeneği 5 olmalıdır. Şıklarda genellikle 6 sayısı da bulunarak dikkat dağınıklığı ölçülür. LGS dereceleri bu küçük nüanslarla belirlenir.',
        formula: 'Doğru Yanıt: 5 Kesim (Asla 6 parça ile 6 kesimi karıştırma!)'
      }
    ]
  },
  {
    id: 'sample-3',
    title: 'Çarpanlar ve Katlar - EBOB Ağaç Dikme Sıklığı',
    text: 'Kenar uzunlukları 48 metre ve 60 metre olan dikdörtgen şeklindeki bir tarlanın etrafına, köşelere de gelmek şartıyla eşit aralıklarla fidanlar dikilecektir.',
    query: 'Buna göre bu tarla için en az kaç fidana ihtiyaç vardır?',
    steps: [
      {
        title: 'Adım 1: Problem Türünü Keşfetme (EBOB mu EKOK mu?)',
        desc: 'Büyük boyutlardaki alan bölünerek eşit aralıklı küçük parçalara (fidan dikilecek aralıklara) ayrıldığından, bu bir "Bütünden Parçaya" gitme problemidir. Dolayısıyla EBOB bulmalıyız.',
        formula: 'Kural: Bölme, parçalama, eşit aralıklar bulma = EBOB!'
      },
      {
        title: 'Adım 2: EBOB Değerini Hesaplama',
        desc: '48 ve 60 sayılarının her ikisini de bölen en büyük ortak böleni bulalım:\n48 = 2⁴ · 3  \n60 = 2² · 3 · 5  \nEBOB(48, 60) için ortak asallardan üssü en küçük olanlar çarpılır:',
        formula: 'EBOB(48, 60) = 2² · 3 = 12 metredir. (İki fidan arası mesafe)'
      },
      {
        title: 'Adım 3: Fidan Sayısı Formülü',
        desc: 'Dikdörtgen şeklindeki kapalı alanların etrafına eşit aralıklarla ağaç/fidan dikerken pratik formülümüz:',
        formula: 'Fidan Sayısı = Çevre / İki Fidan Arasındaki Mesafe'
      },
      {
        title: 'Adım 4: Hesabı Tamamlama ve Sonuç',
        desc: 'Tarlanın çevresi: 2 · (48 + 60) = 2 · 108 = 216 metredir.\nFidan aralığı EBOB olan 12 metre olduğuna göre:',
        formula: 'Fidan Sayısı = 216 / 12 = 18 adet fidan dikilmelidir.'
      }
    ]
  }
];

// Presets for Formula Quizzes
const FORMULA_QUIZZES = [
  {
    question: '3⁴ · 3¹⁰ işleminin sonucu aşağıdakilerden hangisidir?',
    options: [
      { id: 'a', text: '3¹⁴', isCorrect: true, feedback: 'Harika! Tabanlar aynı ise üsler toplanır: 4 + 10 = 14.' },
      { id: 'b', text: '3⁴⁰', isCorrect: false, feedback: 'Hata! Çarpma işleminde üsler çarpılmaz, toplanır.' },
      { id: 'c', text: '9¹⁴', isCorrect: false, feedback: 'Hata! Tabanlar çarpılmaz, sadece ortak taban yazılır.' }
    ]
  },
  {
    question: '√12 + √27 işleminin sonucu aşağıdakilerden hangisidir?',
    options: [
      { id: 'a', text: '√39', isCorrect: false, feedback: 'Dikkat! Köklü sayılarda kök içleri doğrudan toplanamaz.' },
      { id: 'b', text: '5√3', isCorrect: true, feedback: 'Mükemmel! √12 = 2√3 ve √27 = 3√3 olduğundan: 2√3 + 3√3 = 5√3 olur.' },
      { id: 'c', text: '6', isCorrect: false, feedback: 'Hata! Sayıları kök dışına doğru ayıkladığınızdan emin olun.' }
    ]
  }
];

type SubTab = 'main' | 'soru-cozum' | 'stratejik-ipucu' | 'hata-analiz' | 'rehberlik' | 'sohbet';

export default function AIGuideView() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('main');

  const { accessToken, connectCalendar } = useFirebase();
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  const handleConnectCalendar = async () => {
    setIsSyncingCalendar(true);
    try {
      const token = await connectCalendar();
      if (token) {
        alert('Google Takvim başarıyla bağlandı! Artık programınızı takviminize kaydedebilirsiniz.');
      }
    } catch (e) {
      console.error(e);
      alert('Google Takvim bağlantısı başarısız oldu.');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleSyncCampToCalendar = async () => {
    if (!accessToken) {
      alert('Lütfen önce Google Takviminizi bağlayın.');
      return;
    }
    const confirmed = window.confirm(
      'Haftalık çalışma programındaki hedefleri Google Takviminize kaydetmek istiyor musunuz? Her çalışma günü için takvimizde etkinlik oluşturulacak.'
    );
    if (!confirmed) return;

    setIsSyncingCalendar(true);
    try {
      const count = await addLgsWeeklyCampToCalendar(accessToken, {
        weakTopic,
        studyStyle,
        tasks: weeklySchedule.tasks
      });
      alert(`Harika! ${count} adet ders çalışma etkinliği Google Takviminize başarıyla eklendi!`);
    } catch (err: any) {
      console.error(err);
      alert('Takvim eşitlemesi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // --- 1. SORU COZUM STATE ---
  const [selectedSample, setSelectedSample] = useState(SAMPLE_QUESTIONS[0]);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [solvingMode, setSolvingMode] = useState<'sample' | 'custom'>('sample');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [customSteps, setCustomSteps] = useState<any[]>([]);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  // --- 2. STRATEJİK İPUCU STATE ---
  const [selectedFormulaCategory, setSelectedFormulaCategory] = useState<'us' | 'kok' | 'carpan'>('us');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});

  // --- 3. HATA ANALİZİ STATE ---
  const [selectedErrorCategory, setSelectedErrorCategory] = useState<'process' | 'logic' | 'reading'>('process');
  const [userErrorLog, setUserErrorLog] = useState('');
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [isAnalyzingError, setIsAnalyzingError] = useState(false);

  // --- 4. REHBERLİK & KAMP PROGRAMI ---
  const [weakTopic, setWeakTopic] = useState('Üslü Sayılar');
  const [dailyQuota, setDailyQuota] = useState(50);
  const [studyStyle, setStudyStyle] = useState('Dengeli Rutin');
  const [weeklySchedule, setWeeklySchedule] = useState<any>(() => {
    const saved = localStorage.getItem('lgs_ai_camp_program');
    return saved ? JSON.parse(saved) : null;
  });
  const [completedDays, setCompletedDays] = useState<string[]>(() => {
    const saved = localStorage.getItem('lgs_ai_camp_completed_days');
    return saved ? JSON.parse(saved) : [];
  });

  // --- 5. COUNSELING CHAT ---
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: 'user' | 'ai'; text: string; timestamp: string }>>([
    {
      id: 'init-1',
      role: 'ai',
      text: 'Merhaba genç şampiyon! LGS sınav stresi, zaman yönetimi, deneme netlerini artırma veya ders programı planlama hakkında her konuda bana danışabilirsin. Sana nasıl destek olabilirim?',
      timestamp: '18:30'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Persistent storage reactions
  useEffect(() => {
    if (weeklySchedule) {
      localStorage.setItem('lgs_ai_camp_program', JSON.stringify(weeklySchedule));
    } else {
      localStorage.removeItem('lgs_ai_camp_program');
    }
  }, [weeklySchedule]);

  useEffect(() => {
    localStorage.setItem('lgs_ai_camp_completed_days', JSON.stringify(completedDays));
  }, [completedDays]);

  const capabilities = [
    { 
      id: 'soru-cozum', 
      title: 'Anlık Soru Çözümü', 
      icon: Zap, 
      desc: 'Formül ve kuralları hatırlatarak çözümü adım adım kavratırım.', 
      color: 'from-amber-500/10 to-amber-600/5 text-amber-600 hover:border-amber-400' 
    },
    { 
      id: 'stratejik-ipucu', 
      title: 'Stratejik İpuçları', 
      icon: Lightbulb, 
      desc: 'LGS Matematik formül kartları ve pratik kuralları hızlıca test edin.', 
      color: 'from-blue-500/10 to-blue-600/5 text-blue-600 hover:border-blue-400' 
    },
    { 
      id: 'hata-analiz', 
      title: 'Hata Analizi Laboratuvarı', 
      icon: Bot, 
      desc: 'Yaptığın işlem ve okuma hatalarının kök nedenini teşhis ederim.', 
      color: 'from-rose-500/10 to-rose-600/5 text-rose-600 hover:border-rose-400' 
    },
    { 
      id: 'rehberlik', 
      title: 'Kişisel LGS Kampı', 
      icon: Sparkles, 
      desc: 'Zayıf olduğun konuya göre akıllı bir LGS çalışma programı hazırlarım.', 
      color: 'from-purple-500/10 to-purple-600/5 text-purple-600 hover:border-purple-400' 
    },
  ];

  // Global Dispatch helper for sidebar integration
  const askGlobalMentor = (promptText: string) => {
    window.dispatchEvent(new CustomEvent('ask_ai_mentor', {
      detail: { prompt: promptText }
    }));
  };

  // --- GENERATING CUSTOM STEPS (LOCAL SIMULATION WITH MATH RULES) ---
  const handleGenerateCustomSteps = () => {
    if (!customQuestionText.trim()) return;
    setIsGeneratingCustom(true);
    setSolvingMode('custom');
    setCurrentStepIndex(0);

    setTimeout(() => {
      const q = customQuestionText.toLocaleLowerCase('tr-TR');
      let topic = "Matematik Çözüm Ağacı";
      let keyRule = "Kural: Çözüm adımlarını dikkatle takip et.";
      
      if (q.includes('üs') || q.includes('kuvvet') || q.includes('derece')) {
        topic = "Üslü İfadeler Çözüm Sentezi";
        keyRule = "Kural: aⁿ · aᵐ = aⁿ⁺ᵐ ve aⁿ / aᵐ = aⁿ⁻ᵐ kuralları geçerlidir.";
      } else if (q.includes('kök') || q.includes('kareköklü') || q.includes('√')) {
        topic = "Kareköklü İfadeler Çözüm Sentezi";
        keyRule = "Kural: √a²·b = a√b kök dışına çıkarma ve √a · √b = √a·b kuralları incelenir.";
      } else if (q.includes('ebob') || q.includes('ekok') || q.includes('çarpan') || q.includes('kat')) {
        topic = "Çarpanlar ve Katlar Çekirdeği";
        keyRule = "Kural: Eşit aralık veya bölme için EBOB; ortak kat veya karşılaşma için EKOK.";
      }

      setCustomSteps([
        {
          title: 'Adım 1: Soru Sentezi ve Hedef Belirleme',
          desc: `Gönderdiğin soruyu LGS standartlarında analiz ettim. Soru temelde "${topic}" konusunu içeriyor. Hedefimiz, soruda verilen değişkenleri listeleyip bizden istenen asıl matematiksel niceliği ortaya çıkarmaktır.`,
          formula: `Sorunun Özü: ${customQuestionText.substring(0, 100)}${customQuestionText.length > 100 ? '...' : ''}`
        },
        {
          title: 'Adım 2: Formül/Kazanım Hatırlatma',
          desc: 'Bu tip sorularda en kritik adım doğru kuralları seçip işe koyulmaktır. Senin için en uygun LGS kazanımsal formülünü seçtim:',
          formula: keyRule
        },
        {
          title: 'Adım 3: Adım Adım Cebirsel Model',
          desc: 'Seçilen formülleri sorudaki sayılara uygulayarak denklemi kuruyoruz. Her iki tarafın sadeleştiğinden emin olmalı ve LGS\'de işlem hatasına kurban gitmemek için adımları yazarak çözmeliyiz.',
          formula: 'Denklem: Verilen nicelikler oranlanarak sonuca gidilecektir.'
        },
        {
          title: 'Adım 4: LGS Çeldirici Farkındalığı',
          desc: 'LGS Şampiyonu asla acele karar vermez! Şıklardaki en yakın çeldiriciler genellikle birim uyuşmazlığından (metre/santimetre) veya sınır durumlarından (fidan ağaç sayısı uyuşmazlığı) kaynaklanır.',
          formula: 'LGS Tavsiyesi: Son ulaşılan birimi soru kökünün istediği birimle karşılaştır.'
        }
      ]);
      setIsGeneratingCustom(false);
    }, 1200);
  };

  // --- REHBERLİK PROGRAM YAPICI ---
  const handleBuildCampProgram = () => {
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    let activities: Record<string, { title: string; target: number; tip: string }> = {};

    days.forEach((day, index) => {
      let coeff = 1.0;
      if (day === 'Cumartesi' || day === 'Pazar') {
        coeff = studyStyle === 'Yoğun Kamp Modu' ? 1.4 : 1.2;
      } else {
        coeff = studyStyle === 'Tekrar ve Pratik' ? 0.8 : 1.0;
      }

      const rawTarget = Math.round(dailyQuota * coeff);
      const targetSoru = Math.max(15, rawTarget);

      let dayTitle = '';
      let dayTip = '';

      if (index === 0) {
        dayTitle = `${weakTopic} Konu Tekrarı & Temel Isınma`;
        dayTip = 'Konu özetine 20 dakika göz atıp formülleri sesli oku.';
      } else if (index === 1) {
        dayTitle = `${weakTopic} MEB Kazanım Soruları`;
        dayTip = 'Formülleri kağıda bizzat yazıp yanına koyarak test çöz.';
      } else if (index === 2) {
        dayTitle = `Hız ve Süre Odaklı ${weakTopic} Çözümü`;
        dayTip = 'Her 10 soru için kendine 20 dakika süre tutmayı unutma.';
      } else if (index === 3) {
        dayTitle = `${weakTopic} Çıkmış Soru Analizleri`;
        dayTip = 'Son 5 yılın LGS sorularını büyük bir dikkatle incele.';
      } else if (index === 4) {
        dayTitle = `Hatalı Soruların Tekrar İncelenmesi`;
        dayTip = 'Hafta boyunca boş bıraktığın veya yanlış yaptığın soruları tekrar çöz.';
      } else if (index === 5) {
        dayTitle = `${weakTopic} LGS Yeni Nesil Denemesi`;
        dayTip = 'Sınav provası gibi sessiz bir ortamda, süre tutarak çöz.';
      } else {
        dayTitle = `Haftalık Genel Değerlendirme & Dinlenme`;
        dayTip = 'Yapamadığın 3 spesifik konuyu AI Mentora sorup haftayı kapat.';
      }

      activities[day] = {
        title: dayTitle,
        target: targetSoru,
        tip: dayTip
      };
    });

    setWeeklySchedule({
      id: Date.now().toString(),
      weakTopic,
      dailyQuota,
      studyStyle,
      tasks: activities
    });
    setCompletedDays([]);
  };

  const toggleDayCompletion = (day: string) => {
    setCompletedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const getWeekCompletionPercentage = () => {
    if (!weeklySchedule) return 0;
    const completedCount = completedDays.length;
    return Math.round((completedCount / 7) * 100);
  };

  // --- MOTİVASYON SOHBET DİYALOGLARI (SIMULATION IN TURKISH) ---
  const handleSendChatMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      text,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiTyping(true);

    setTimeout(() => {
      let replyText = 'Harika bir soru şampiyon! LGS matematik dersinde başarılı olmanın sırrı her gün disiplinli çalışmaktan ve pes etmemekten geçer. Sorunu detaylandırayım:';
      const lowered = text.toLocaleLowerCase('tr-TR');

      if (lowered.includes('stres') || lowered.includes('heyecan') || lowered.includes('korku')) {
        replyText = "LGS stresini yönetmek tamamen fizyolojik ve zihinsel hazırlığa bağlıdır.\n\n1. Sınav sadece bilgi seviyeni ölçer, senin karakterini veya zekanı belirlemez. Bunu kendine hatırlat.\n2. Denemelerde heyecanlandığında kalemi bırakıp 3 kere derin diyafram nefesi al.\n3. Son ana kadar konu eksiklerini kapatmaya devam et, belirsizlik azaldıkça stres de azalacaktır. Sen elinden geleni yapıyorsun, kendine güven!";
      } else if (lowered.includes('net') || lowered.includes('artırma') || lowered.includes('deneme')) {
        replyText = "Deneme netlerini artırmanın en kesin yolu 'Yanlış Defteri' tutmaktır.\n\n1. Doğru yaptığın sorular sana o konuyu bildiğini gösterir ama asıl netini artıracak olanlar yanlış yapıp boş bıraktığın sorulardır.\n2. Her denemeden sonra boş sorularını mutlaka öğretmenine veya bana (AI Mentor) çözdür ve o soruyu 2 gün sonra kendin sıfırdan çözmeye çalış.\n3. Genellikle LGS'de netler doğrusal gitmez, bir süre sabit kalıp aniden yükselir. Sabretmeye devam!";
      } else if (lowered.includes('matematik') || lowered.includes('sayısal')) {
        replyText = "LGS Matematik dersine çalışırken mutlaka üç aşamalı gitmelisin:\n\nAşama 1: Temel kazanım sorularını sıfır hatayla çöz. Formülleri tamamen özümse.\nAşama 2: Şekilli, görsel yorumlama gerektiren kolay-orta 'Yarım Yeni Nesil' sorulara geç.\nAşama 3: LGS tarzı çoklu kazanım içeren uzun paragraf sorularını süreli çöz.\n\nSakın en baştan en zor soruları çözmeye çalışıp motivasyonunu kırma. Adım adım yükseleceğiz!";
      } else if (lowered.includes('zaman') || lowered.includes('yetişmiyor') || lowered.includes('süre')) {
        replyText = "Sayısal bölümde zaman yetiştirmenin ilacı 'Turlama Tekniği' kullanmaktır.\n\n1. Sınavda her sorunun puan değeri aynıdır. Zor bir soruya takılıp 5 dakikanı harcamak yerine yanına bir soru işareti koyup hemen sonraki kolay soruya geç.\n2. Evde test çözerken mutlaka yanına kronometre koy. Soru başına ortalama 2 dakika hedefin olsun.\n3. Soru okuma hızını artırmak için matematik terimlerinin ne ifade ettiğini çok iyi bilmelisin. Hızlı okuma pratikleri yap.";
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'ai' as const,
        text: replyText,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiMsg]);
      setIsAiTyping(false);
    }, 1200);
  };

  // --- HATA ANALİZİ LAB ---
  const handleAnalyzeUserErrorLog = () => {
    if (!userErrorLog.trim()) return;
    setIsAnalyzingError(true);
    setErrorFeedback(null);

    setTimeout(() => {
      const log = userErrorLog.toLocaleLowerCase('tr-TR');
      let customAnalysis = "";

      if (log.includes('eksi') || log.includes('işlem') || log.includes('hesap')) {
        customAnalysis = "Analizime göre yaşadığın sorun bir COĞRAFİ/İŞLEMSEL dalgınlıktır.\n\nÖneri:\n- Negatif sayıların çift kuvvetleri alınırken parantez olup olmadığına çok dikkat et.\n- İşlemi kağıt üzerinde mutlaka satır satır yaz, zihinden yapmaya çalışmak hata payını %40 artırır.";
      } else if (log.includes('soru') || log.includes('kök') || log.includes('anla') || log.includes('yanlış okudum')) {
        customAnalysis = "Analizime göre yaşadığın sorun OKUMA ve KAVRAMA hatasıdır.\n\nÖneri:\n- Her yeni soruya başladığında 'verilenler' ve 'istenenler' listesi yap.\n- Sorudaki 'olamaz', 'değildir', 'en çok', 'en az' gibi kelimelerin altını kalın bir çizgiyle çiz.\n- Sonucu bulduğunda şıklara gitmeden önce 'Ben şu an neyi buldum?' sorusunu kendine sor.";
      } else {
        customAnalysis = "Analizime göre yaşadığın sorun KURAL VE BİLGİ EKSİKLİĞİNDEN kaynaklanıyor olabilir.\n\nÖneri:\n- Bu konu ile ilgili temel formül kağıtlarını tekrar yazarak çalış.\n- Önce çözümlü örnek soruları incele, ardından kendin çözmeyi dene.\n- Unutma, pratik yapmak beyni bu şablonlara alıştırır!";
      }

      setErrorFeedback(customAnalysis);
      setIsAnalyzingError(false);
    }, 1000);
  };

  return (
    <div className="p-4 sm:p-8 lg:p-12 max-w-4xl mx-auto space-y-8 animate-slide-up">
      
      {/* HEADER SECTION */}
      {activeSubTab === 'main' ? (
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-2">
            <Bot size={14} className="animate-pulse" />
            Yapay Zeka Mentorun
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black text-primary italic leading-tight">
            Sana Nasıl Yardımcı Olabilirim?
          </h1>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-base sm:text-lg">
            LGS yolculuğunda her soru bir basamak. Ben senin bu basamakları sağlam çıkmanı sağlayan kişisel yapay zeka antrenörünüm.
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveSubTab('main')}
              className="p-2 border border-outline hover:border-primary/50 text-on-surface hover:text-primary rounded-xl transition-all bg-white cursor-pointer shadow-sm active:scale-95"
              title="Ana Menüye Dön"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase font-mono bg-primary/5 px-2.5 py-1 rounded-md">
                Yapay Zeka Yardımcısı
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-primary mt-1">
                {activeSubTab === 'soru-cozum' && 'Yapay Zekalı Adım Adım Soru Çözümü'}
                {activeSubTab === 'stratejik-ipucu' && 'Stratejik İpuçları ve Formül Kartları'}
                {activeSubTab === 'hata-analiz' && 'Gelişmiş Hata Analiz Laboratuvarı'}
                {activeSubTab === 'rehberlik' && 'Kişiselleştirilmiş LGS Kamp Programı'}
                {activeSubTab === 'sohbet' && 'LGS Danışmanlık ve Motivasyon Sohbeti'}
              </h2>
            </div>
          </div>
          <span className="text-[11px] font-medium text-on-surface-variant font-serif italic self-start sm:self-center">
            {activeSubTab === 'soru-cozum' && 'Takıldığın soruyu adım adım kavrayarak çöz.'}
            {activeSubTab === 'stratejik-ipucu' && 'Önemli formüller ve mini gelişim testi.'}
            {activeSubTab === 'hata-analiz' && 'Sınavlardaki hatalarından ders çıkar.'}
            {activeSubTab === 'rehberlik' && 'Zayıf yörüngelerine göre özel program yap.'}
            {activeSubTab === 'sohbet' && 'Hap niteliğinde rehberlik ve motivasyon tavsiyeleri.'}
          </span>
        </div>
      )}

      {/* RENDER DYNAMIC CANVAS */}
      <AnimatePresence mode="wait">
        
        {/* VIEW 0: MAIN CAPABILITIES SELECTOR */}
        {activeSubTab === 'main' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {capabilities.map((cap, i) => (
                <motion.div
                  key={cap.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => setActiveSubTab(cap.id as SubTab)}
                  className={`bg-white border border-outline rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-primary/10 hover:border-b-primary cursor-pointer hover:-translate-y-0.5`}
                >
                  <div className="w-12 h-12 bg-surface-dim rounded-xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <cap.icon size={22} className="group-hover:rotate-6 transition-transform" />
                  </div>
                  <h3 className="font-serif font-extrabold text-xl text-primary flex items-center gap-2 group-hover:underline decoration-primary/10">
                    <span>{cap.title}</span>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
                  </h3>
                  <p className="text-on-surface-variant text-xs sm:text-sm mt-3 leading-relaxed">
                    {cap.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* CALL TO ACTION BOT DEEP PANEL */}
            <div className="bg-primary text-white rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="space-y-3 relative z-10 text-center md:text-left max-w-lg">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <MessageSquare size={12} className="text-yellow-400 shrink-0" />
                  <span>Psikolojik Danışmanlık ve Motivasyon</span>
                </div>
                <h2 className="text-2xl font-serif italic font-bold leading-tight">Özel bir LGS sorunun mu var veya bunaldın mı?</h2>
                <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
                  Matematik konuları, çalışma taktikleri, stres yönetimi veya LGS hazırlık süreci hakkında her şeyi mentoruna sorabilirsin.
                </p>
              </div>
              <button 
                onClick={() => setActiveSubTab('sohbet')}
                className="shrink-0 bg-white hover:bg-neutral-100 text-primary px-8 py-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-widest relative z-10 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                Sohbeti Başlat
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW 1: ANLIK SORU COZUMU SUBPAGE */}
        {activeSubTab === 'soru-cozum' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-6">
              
              {/* Mode Selection */}
              <div className="flex border-b border-outline">
                <button
                  onClick={() => { setSolvingMode('sample'); setCurrentStepIndex(0); }}
                  className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    solvingMode === 'sample' ? 'border-primary text-primary font-serif italic' : 'border-transparent text-on-surface-variant'
                  }`}
                >
                  Örnek LGS Matematik Soruları
                </button>
                <button
                  onClick={() => { setSolvingMode('custom'); setCurrentStepIndex(0); }}
                  className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    solvingMode === 'custom' ? 'border-primary text-primary font-serif italic' : 'border-transparent text-on-surface-variant'
                  }`}
                >
                  Kendi Sorunu Yaz
                </button>
              </div>

              {solvingMode === 'sample' ? (
                <div className="space-y-5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary block">Bir Soru Seçin:</label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {SAMPLE_QUESTIONS.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => { setSelectedSample(q); setCurrentStepIndex(0); }}
                        className={`p-4 border text-left rounded-xl transition-all font-medium text-xs sm:text-sm cursor-pointer flex justify-between items-center gap-3 ${
                          selectedSample.id === q.id 
                            ? 'bg-primary/5 text-primary border-primary shadow-sm' 
                            : 'bg-white text-on-surface hover:bg-surface-dim border-outline'
                        }`}
                      >
                        <span className="font-serif font-bold italic block">{q.title}</span>
                        <Check size={16} className={`text-primary shrink-0 transition-opacity ${selectedSample.id === q.id ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    ))}
                  </div>

                  {/* Highlight Box representing active question */}
                  <div className="bg-surface-dim/70 border border-outline p-5 rounded-2xl space-y-2.5 relative">
                    <div className="absolute top-4 right-4 text-[10px] font-black text-primary bg-white px-2.5 py-1 border border-outline rounded-full uppercase">
                      LGS Soru Köşesi
                    </div>
                    <div className="space-y-1 pr-14">
                      <h4 className="font-serif font-black text-primary text-sm sm:text-base">{selectedSample.title}</h4>
                      <p className="text-xs sm:text-sm text-on-surface italic">{selectedSample.text}</p>
                    </div>
                    <p className="text-xs sm:text-sm text-primary font-bold bg-white p-3 rounded-lg border border-outline shadow-sm">
                      {selectedSample.query}
                    </p>
                  </div>

                  {/* Solving Step Walkthrough */}
                  <div className="border-t border-outline pt-6 space-y-6">
                    <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant">
                      <span className="uppercase tracking-widest">ÇÖZÜM ADIMI:</span>
                      <span className="font-serif font-bold italic text-primary">{currentStepIndex + 1} / {selectedSample.steps.length}</span>
                    </div>

                    {/* Step progress bars */}
                    <div className="grid grid-cols-4 gap-2">
                      {selectedSample.steps.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`h-1.5 rounded-full transition-all ${
                            idx <= currentStepIndex ? 'bg-primary' : 'bg-outline'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Active Step details */}
                    <motion.div
                      key={currentStepIndex}
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-3"
                    >
                      <h3 className="text-base font-serif font-black text-primary italic">
                        {selectedSample.steps[currentStepIndex].title}
                      </h3>
                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                        {selectedSample.steps[currentStepIndex].desc}
                      </p>
                      <div className="bg-white border border-primary/10 p-4 rounded-xl font-mono text-xs text-primary font-bold shadow-sm whitespace-pre-wrap">
                        {selectedSample.steps[currentStepIndex].formula}
                      </div>
                    </motion.div>

                    {/* Back and Next buttons */}
                    <div className="flex justify-between items-center pt-2 gap-4">
                      <button
                        onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentStepIndex === 0}
                        className="px-5 py-3 border border-outline text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-surface-dim disabled:opacity-40 transition-all cursor-pointer text-stone-600 disabled:cursor-not-allowed"
                      >
                        Önceki Adım
                      </button>
                      
                      {currentStepIndex < selectedSample.steps.length - 1 ? (
                        <button
                          onClick={() => setCurrentStepIndex(prev => prev + 1)}
                          className="px-5 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          Sonraki Adımı Göster
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setCurrentStepIndex(0);
                            alert('Harika! Soruyu tamamen incelediniz. Matematik mantığını zihne yazmak bu kadar basit.');
                          }}
                          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={14} />
                          <span>Çözümü Baştan Al</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                      Çözülemeyen Matematik Sorusunu Yapıştırın veya Yazın:
                    </label>
                    <textarea
                      value={customQuestionText}
                      onChange={(e) => setCustomQuestionText(e.target.value)}
                      placeholder="Örnek: Bir bidonda √45 litre süt vardır. Bu sütün √5 litresi satılırsa geriye ne kadar kalır?"
                      rows={4}
                      className="w-full bg-surface-dim border border-outline rounded-xl p-4 text-xs sm:text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-primary font-medium"
                    />
                  </div>

                  <button
                    onClick={handleGenerateCustomSteps}
                    disabled={isGeneratingCustom || !customQuestionText.trim()}
                    className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40 shadow-md cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isGeneratingCustom ? 'Çözüm Ağacı Yapay Zekayla Örülüyor...' : 'Soruyu Yapay Zeka Adımlarıyla Çöz ➔'}
                  </button>

                  {customSteps.length > 0 && !isGeneratingCustom && (
                    <div className="space-y-6 border-t border-outline pt-6">
                      <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant">
                        <span className="uppercase tracking-widest text-primary font-serif italic">YAPAY ZEKA ADIMSAL ANALİZİ:</span>
                        <span>{currentStepIndex + 1} / {customSteps.length}</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {customSteps.map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`h-1.5 rounded-full transition-all ${
                              idx <= currentStepIndex ? 'bg-primary' : 'bg-outline'
                            }`}
                          />
                        ))}
                      </div>

                      <motion.div
                        key={currentStepIndex}
                        initial={{ opacity: 0, x: 5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-3"
                      >
                        <h3 className="text-base font-serif font-black text-primary italic">
                          {customSteps[currentStepIndex].title}
                        </h3>
                        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                          {customSteps[currentStepIndex].desc}
                        </p>
                        <div className="bg-white border border-primary/10 p-4 rounded-xl font-mono text-xs text-primary font-bold shadow-sm">
                          {customSteps[currentStepIndex].formula}
                        </div>
                      </motion.div>

                      <div className="flex justify-between items-center gap-4 pt-2">
                        <button
                          onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentStepIndex === 0}
                          className="px-5 py-3 border border-outline text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-surface-dim disabled:opacity-40 transition-all cursor-pointer text-stone-600 disabled:cursor-not-allowed"
                        >
                          Önceki Adım
                        </button>
                        
                        {currentStepIndex < customSteps.length - 1 ? (
                          <button
                            onClick={() => setCurrentStepIndex(prev => prev + 1)}
                            className="px-5 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            Sonraki Adım ➔
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setCurrentStepIndex(0);
                              alert('Harika! Hazırladığım çözümün tüm aşamalarını başarıyla gözden geçirdin.');
                            }}
                            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            Baştan Oku
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PEDAGOGICAL NOTICE */}
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl text-amber-800 leading-relaxed text-xs">
              <AlertTriangle className="shrink-0 mt-0.5" size={16} />
              <div>
                <span className="font-extrabold block mb-0.5">Dikkat! LGS Antrenörlük Yaklaşımı:</span>
                Tüm soruların doğrudan tam cevabını vermek yerine sana kuralları ve aşamaları gösterip mantıksal bir çıkarım yapmanı sağlarım. Sınavda soruyla baş başa kaldığında bu metodoloji sana net kazandıracak.
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: STRATEJİK İPUÇLARI SUBPAGE */}
        {activeSubTab === 'stratejik-ipucu' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Formula sheet cards */}
            <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-outline pb-4 flex-wrap gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Matematik Formül Defteri</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedFormulaCategory('us')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${selectedFormulaCategory === 'us' ? 'bg-primary text-white' : 'bg-surface-dim text-on-surface-variant'}`}
                  >
                    Üslü Sayılar
                  </button>
                  <button 
                    onClick={() => setSelectedFormulaCategory('kok')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${selectedFormulaCategory === 'kok' ? 'bg-primary text-white' : 'bg-surface-dim text-on-surface-variant'}`}
                  >
                    Köklü Sayılar
                  </button>
                  <button 
                    onClick={() => setSelectedFormulaCategory('carpan')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${selectedFormulaCategory === 'carpan' ? 'bg-primary text-white' : 'bg-surface-dim text-on-surface-variant'}`}
                  >
                    EBOB / EKOK
                  </button>
                </div>
              </div>

              {/* DYNAMIC FORMULA SHEET DRAW */}
              {selectedFormulaCategory === 'us' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-primary text-white p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-mono font-bold uppercase text-gray-400">Üslü Çarpım Kuralı</span>
                    <h4 className="font-mono text-xl font-bold my-4">a<sup>m</sup> · a<sup>n</sup> = a<sup>m + n</sup></h4>
                    <p className="text-[11px] text-gray-300">Tabanları aynı olan iki üslü ifade çarpılırken ortak taban yazılır ve üsler birbirleriyle toplanır.</p>
                  </div>
                  <div className="bg-primary text-white p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-mono font-bold uppercase text-gray-400">Üs Üzeri Üs Kuralı</span>
                    <h4 className="font-mono text-xl font-bold my-4">(a<sup>m</sup>)<sup>n</sup> = a<sup>m · n</sup></h4>
                    <p className="text-[11px] text-gray-300">Bir üslü ifadenin tekrar üssü alınırken taban sabit kalır ve üsler çarpılır.</p>
                  </div>
                </div>
              )}

              {selectedFormulaCategory === 'kok' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-primary text-white p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-mono font-bold uppercase text-gray-400">Kılıfına Çıkarma</span>
                    <h4 className="font-mono text-xl font-bold my-4">√(a² · b) = a√b</h4>
                    <p className="text-[11px] text-gray-300">Kareköklü sayıların içindeki tam kare çarpanlar, karekök dışına karelerini bırakıp katsayı şeklinde çıkarılır.</p>
                  </div>
                  <div className="bg-primary text-white p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-mono font-bold uppercase text-gray-400">Köklerde Çarpım</span>
                    <h4 className="font-mono text-xl font-bold my-4">√a · √b = √(a · b)</h4>
                    <p className="text-[11px] text-gray-300">Kök dışı katsayılar kendi arasında, kök içi ifadeler ise tek bir ortak kök içinde kendi aralarında çarpılır.</p>
                  </div>
                </div>
              )}

              {selectedFormulaCategory === 'carpan' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-primary text-white p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-mono font-bold uppercase text-gray-400">EBOB Karar Verme</span>
                    <h4 className="font-mono text-lg font-bold my-4">Bütünden Parçaya ➔ EBOB</h4>
                    <p className="text-[11px] text-gray-300">Uzun çubukları eşit bölmelere ayırma, tarlanın etrafına eşit aralıkla fidan dikme problemlerinde EBOB hesaplanır.</p>
                  </div>
                  <div className="bg-primary text-white p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-mono font-bold uppercase text-gray-400">EKOK Karar Verme</span>
                    <h4 className="font-mono text-lg font-bold my-4">Parçadan Bütüne ➔ EKOK</h4>
                    <p className="text-[11px] text-gray-300">Farklı saatlerde çalan zillerin birlikte ne zaman çalacağını veya küçük tuğlalarla büyük küp yapma sorularında kullanılır.</p>
                  </div>
                </div>
              )}
            </div>

            {/* QUICK TRAINING INTERACTIVE TESTS */}
            <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary block">Akıllı Formül Pratik Sınavı:</span>
              
              <div className="space-y-8">
                {FORMULA_QUIZZES.map((quiz, qIdx) => (
                  <div key={qIdx} className="space-y-3.5 p-4 bg-surface-dim/40 border border-outline rounded-2xl">
                    <h4 className="text-xs sm:text-sm font-bold text-primary flex items-start gap-2 leading-relaxed">
                      <span className="px-2 py-0.5 bg-primary text-white rounded font-mono text-[10px]">Soru {qIdx + 1}</span>
                      <span>{quiz.question}</span>
                    </h4>

                    <div className="grid grid-cols-1 gap-2 pl-3">
                      {quiz.options.map((opt) => {
                        const isChosen = quizAnswers[qIdx] === opt.id;
                        const showsFeedback = quizSubmitted[qIdx];

                        return (
                          <button
                            key={opt.id}
                            disabled={showsFeedback}
                            onClick={() => {
                              setQuizAnswers(prev => ({ ...prev, [qIdx]: opt.id }));
                              setQuizSubmitted(prev => ({ ...prev, [qIdx]: true }));
                            }}
                            className={`p-3.5 text-left text-xs sm:text-sm rounded-xl cursor-pointer transition-all border ${
                              showsFeedback
                                ? opt.isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-400 text-emerald-800 font-semibold'
                                  : isChosen
                                    ? 'bg-rose-500/10 border-rose-300 text-rose-800'
                                    : 'bg-white text-stone-400 border-outline'
                                : isChosen
                                  ? 'bg-primary/5 border-primary text-primary font-semibold'
                                  : 'bg-white hover:bg-surface-dim text-on-surface border-outline'
                            }`}
                          >
                            <span className="font-black italic uppercase font-serif mr-2">{opt.id.toUpperCase()})</span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted[qIdx] && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`text-xs p-3.5 rounded-xl border leading-relaxed flex items-start gap-2 ${
                          quiz.options.find(o => o.id === quizAnswers[qIdx])?.isCorrect
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-100 text-rose-800'
                        }`}
                      >
                        <Compass className="shrink-0 mt-0.5" size={14} />
                        <div>
                          <span className="font-extrabold block">Geri Bildirim:</span>
                          {quiz.options.find(o => o.id === quizAnswers[qIdx])?.feedback}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>

              {Object.keys(quizSubmitted).length > 0 && (
                <button
                  onClick={() => {
                    setQuizAnswers({});
                    setQuizSubmitted({});
                  }}
                  className="px-5 py-2.5 bg-on-surface/5 hover:bg-on-surface/10 rounded-xl text-[10px] uppercase tracking-wider text-on-surface-variant cursor-pointer font-bold border border-outline flex items-center gap-1.5 mx-auto transition-colors"
                >
                  <RotateCcw size={12} />
                  <span>Pratiği Sıfırla</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 3: HATA ANALİZİ LABORATUVARI SUBPAGE */}
        {activeSubTab === 'hata-analiz' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Left selector - 4 columns */}
            <div className="md:col-span-4 space-y-3">
              <span className="text-[10px] font-mono tracking-widest font-bold text-primary block uppercase">Dolgusal Hata Türü</span>
              <button
                onClick={() => setSelectedErrorCategory('process')}
                className={`w-full p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedErrorCategory === 'process' 
                    ? 'bg-primary border-primary text-white shadow-sm' 
                    : 'bg-white border-outline text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Activity size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">İşlem Hatası</span>
                </div>
                <p className="text-[11px] opacity-80 leading-tight">İşaret unutma, dikkatsiz çarpma, parantez karışıklığı.</p>
              </button>

              <button
                onClick={() => setSelectedErrorCategory('logic')}
                className={`w-full p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedErrorCategory === 'logic' 
                    ? 'bg-primary border-primary text-white shadow-sm' 
                    : 'bg-white border-outline text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <BookOpen size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Kazanım Karışıklığı</span>
                </div>
                <p className="text-[11px] opacity-80 leading-tight">Yetersiz formül ezberi, kuralları birbirine karıştırma.</p>
              </button>

              <button
                onClick={() => setSelectedErrorCategory('reading')}
                className={`w-full p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedErrorCategory === 'reading' 
                    ? 'bg-primary border-primary text-white shadow-sm' 
                    : 'bg-white border-outline text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <FileText size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Soru Kökünü Yanlış Okuma</span>
                </div>
                <p className="text-[11px] opacity-80 leading-tight">Olamaz yerine olabilir okuma, birim çevirmeyi gözden kaçırma.</p>
              </button>
            </div>

            {/* Right diagnosis and custom input - 8 columns */}
            <div className="md:col-span-8 space-y-6">
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Teşhis ve Klinik Öneri</span>
                
                {selectedErrorCategory === 'process' && (
                  <div className="space-y-4">
                    <h4 className="text-base font-serif font-black text-primary">İşlem Hatalarında Kusursuzlaşma Reçetesi</h4>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      LGS öğrencilerinin %45'i cevabı bildiği halde eksi/artı işaretinden ya da basit toplama-bölme hatalarından ötürü puan kaybediyor.
                    </p>
                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-1">
                      <span className="text-[10px] text-rose-800 font-extrabold uppercase">KLASİK TUZAK PATERNİ</span>
                      <p className="text-xs text-primary font-bold italic">
                        -2⁴ = -16 iken (-2)⁴ = +16 olduğunu gözden kaçırma tuzağı.
                      </p>
                    </div>
                  </div>
                )}

                {selectedErrorCategory === 'logic' && (
                  <div className="space-y-4">
                    <h4 className="text-base font-serif font-black text-primary">Kazanım Seviyesini Koruma Reçetesi</h4>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      Kuralları pasif okumak yerine kendi ellerinle ispatlayarak kağıda çizmelisin. Soruya başlarken zihninde canlanan kuralın formül referansını kağıdın kenarına çiz.
                    </p>
                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-1">
                      <span className="text-[10px] text-rose-800 font-extrabold uppercase">KLASİK TUZAK PATERNİ</span>
                      <p className="text-xs text-primary font-bold italic">
                        Köklü sayılarda toplama yaparken kök içlerini toplama hatası: √3 + √5 = √8 sanılması (Kök içleri eşitlenmedikçe toplanamaz!).
                      </p>
                    </div>
                  </div>
                )}

                {selectedErrorCategory === 'reading' && (
                  <div className="space-y-4">
                    <h4 className="text-base font-serif font-black text-primary">Kritik Soru Okuma ve Muhakeme Kuralı</h4>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      Soru paragrafı uzunsa önce en alttaki soru kökünü ("Buna göre...") oku. Ne aradığını bilerek üstteki verileri incelemek odaklanmayı %60 artırır.
                    </p>
                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-1">
                      <span className="text-[10px] text-rose-800 font-extrabold uppercase">KLASİK TUZAK PATERNİ</span>
                      <p className="text-xs text-primary font-bold italic">
                        Köşelere de ağaç dikilecek derken aralık sayısı ile fidan sayısı arasındaki köprüleri ihmal etmek.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* INTERACTIVE ERROR LOGGER */}
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary block">Hata Laboratuvarına Soru Gönder:</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Yaptığın spesifik bir hatayı buraya yaz. Sistem zayıf noktalarını otomatik analiz ederek sana taktikler verecektir.
                </p>

                <div className="space-y-4">
                  <textarea
                    value={userErrorLog}
                    onChange={(e) => setUserErrorLog(e.target.value)}
                    placeholder="Örnek: LGS mini denemesinde kesim sayısı yerine parça sayısını aldım..."
                    rows={3}
                    className="w-full bg-surface-dim border border-outline rounded-xl p-4 text-xs sm:text-sm text-primary font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                  <div className="flex justify-between items-center gap-4">
                    {errorFeedback && (
                      <button 
                        onClick={() => { setErrorFeedback(null); setUserErrorLog(''); }}
                        className="text-xs text-on-surface-variant hover:text-primary hover:underline cursor-pointer"
                      >
                        Temizle
                      </button>
                    )}
                    <button
                      onClick={handleAnalyzeUserErrorLog}
                      disabled={isAnalyzingError || !userErrorLog.trim()}
                      className="ml-auto px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isAnalyzingError ? 'Teşhis Konuluyor...' : 'Hatamı Analiz Ettir'}
                    </button>
                  </div>
                </div>

                {errorFeedback && !isAnalyzingError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/5 border border-primary/10 p-5 rounded-2xl space-y-2 whitespace-pre-wrap"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary">
                      <Compass size={13} />
                      <span>Akademik Koç Analizi</span>
                    </div>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      {errorFeedback}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 4: KIŞISEL REHBERLİK & KAMP PROGRAMI SUBPAGE */}
        {activeSubTab === 'rehberlik' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Setup Form */}
            <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary block">Akıllı Program Sihirbazı</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Topic selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary block">Zayıf Matematik Konusu</label>
                  <select 
                    value={weakTopic} 
                    onChange={(e) => setWeakTopic(e.target.value)}
                    className="w-full bg-surface-dim border border-outline rounded-xl p-3 text-xs sm:text-sm font-semibold text-primary outline-none focus:border-primary"
                  >
                    <option value="Üslü Sayılar">Üslü Sayılar</option>
                    <option value="Köklü Sayılar">Köklü Sayılar</option>
                    <option value="Çarpanlar ve Katlar">Çarpanlar ve Katlar</option>
                    <option value="Veri Analizi">Veri Analizi</option>
                    <option value="Cebirsel İfadeler">Cebirsel İfadeler</option>
                  </select>
                </div>

                {/* Target slider */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary block">Günlük Soru Sayısı Hedefi ({dailyQuota})</label>
                  <input 
                    type="range" 
                    min={20} 
                    max={120} 
                    step={10} 
                    value={dailyQuota} 
                    onChange={(e) => setDailyQuota(Number(e.target.value))}
                    className="w-full h-1.5 bg-outline rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[11px] text-on-surface-variant font-mono">
                    <span>20 Soru</span>
                    <span>120 Soru</span>
                  </div>
                </div>

                {/* Study intensity */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary block">Çalışma Metodoloji Şekli</label>
                  <select 
                    value={studyStyle} 
                    onChange={(e) => setStudyStyle(e.target.value)}
                    className="w-full bg-surface-dim border border-outline rounded-xl p-3 text-xs sm:text-sm font-semibold text-primary outline-none focus:border-primary"
                  >
                    <option value="Dengeli Rutin">Dengeli Rutin (Okula Paralel)</option>
                    <option value="Yoğun Kamp Modu">Yoğun Kamp Modu (Hızlı İlerleme)</option>
                    <option value="Tekrar ve Pratik">Tekrar ve Pratik (Temel Güçlendirme)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleBuildCampProgram}
                className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md hover:-translate-y-0.5"
              >
                Kişiselleştirilmiş Programımı Oluştur ➔
              </button>
            </div>

            {/* Generated Program Showcase */}
            {weeklySchedule && (
              <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-outline rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
              >
                <div className="flex justify-between items-center border-b border-outline pb-4 flex-wrap gap-4">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest font-black uppercase text-primary">AKTİF ÇALIŞMA PROGRAMINIZ</span>
                    <h3 className="text-xl font-serif font-black text-primary italic mt-1">{weeklySchedule.weakTopic} Kampı ({weeklySchedule.studyStyle})</h3>
                  </div>

                  {/* Program completeness circle/progress */}
                  <div className="flex items-center gap-3 bg-surface-dim p-3 rounded-2xl border border-outline">
                    <div className="space-y-0.5 text-right">
                      <span className="text-[10px] font-black text-on-surface-variant block uppercase leading-none">Haftalık Tamamlanma</span>
                      <span className="text-lg font-serif font-extrabold text-primary italic leading-none">{getWeekCompletionPercentage()}%</span>
                    </div>
                    <div className="w-10 h-10 rounded-full border-4 border-outline flex items-center justify-center relative overflow-hidden shrink-0">
                      <div className="absolute inset-0 bg-primary/10" />
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-primary transition-all duration-500" 
                        style={{ height: `${getWeekCompletionPercentage()}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Days representation */}
                <div className="space-y-4">
                  {Object.entries(weeklySchedule.tasks).map(([day, task]: [string, any]) => {
                    const isCompleted = completedDays.includes(day);

                    return (
                      <div 
                        key={day} 
                        className={`p-4 sm:p-5 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                          isCompleted 
                            ? 'bg-neutral-50/75 border-emerald-200/60 opacity-80' 
                            : 'bg-white border-outline hover:border-primary/45'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 flex-1 select-none">
                          <button
                            onClick={() => toggleDayCompletion(day)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                              isCompleted 
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                                : 'bg-white border-outline hover:border-primary text-transparent'
                            }`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-serif font-black text-primary tracking-tight">{day}</span>
                              <span className="text-[10px] font-mono font-bold bg-primary/5 text-primary border border-outline px-2 rounded">
                                Hedef Soru: +{task.target}
                              </span>
                            </div>
                            <h4 className={`text-xs sm:text-sm font-serif font-bold ${isCompleted ? 'text-on-surface-variant/60 line-through' : 'text-primary'}`}>
                              {task.title}
                            </h4>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed">
                              {task.tip}
                            </p>
                          </div>
                        </div>

                        {isCompleted && (
                          <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1 shrink-0 self-end sm:self-center">
                            <CheckCircle2 size={11} />
                            <span>Tamamlandı</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Google Calendar Sync Card */}
                <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="font-serif font-black text-primary text-sm flex items-center justify-center sm:justify-start gap-1.5">
                      <CalendarIcon size={16} className="text-primary animate-pulse" />
                      <span>Google Takvim Planlama Entegrasyonu</span>
                    </h4>
                    <p className="text-xs text-on-surface-variant max-w-xl">
                      LGS kampındaki çalışma günlerini cep telefonunuz veya bilgisayarınızdaki Google Takvim'e anında aktarın. Önemli bildirimleri ve hatırlatıcıları kaçırmayın!
                    </p>
                  </div>
                  
                  {accessToken ? (
                    <button
                      onClick={handleSyncCampToCalendar}
                      disabled={isSyncingCalendar}
                      className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 w-full sm:w-auto text-center cursor-pointer disabled:opacity-50"
                    >
                      {isSyncingCalendar ? 'Eşitleniyor...' : '📅 Takvime Kaydet'}
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectCalendar}
                      disabled={isSyncingCalendar}
                      className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 w-full sm:w-auto text-center cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Google Takvimi Bağla</span>
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => {
                      if (confirm('Mevcut kamp programını sıfırlamak istiyor musunuz?')) {
                        setWeeklySchedule(null);
                        setCompletedDays([]);
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                  >
                    Programı Tamamen Sil
                  </button>
                  <p className="text-[10px] text-on-surface-variant font-mono">
                    Programınız tarayıcı veritabanınızda (Local Storage) güvendedir.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* VIEW 5: MOTİVASYON SOHBET MODU */}
        {activeSubTab === 'sohbet' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-outline rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col h-[600px] justify-between gap-4"
          >
            {/* Quick motivators pill box */}
            <div className="space-y-1.5 shrink-0 select-none">
              <span className="text-[9px] font-mono tracking-widest font-bold text-primary block uppercase">Hazır Sorular</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSendChatMessage('LGS deneme netlerimi nasıl artırırım?')}
                  className="px-3 py-1.5 bg-surface-dim hover:bg-primary/5 hover:text-primary rounded-xl text-[11px] font-semibold text-on-surface-variant border border-outline transition-all cursor-pointer"
                >
                  🚀 Deneme Netlerimi Artırma
                </button>
                <button
                  onClick={() => handleSendChatMessage('LGS Matematik dersine nasıl çalışmalıyım?')}
                  className="px-3 py-1.5 bg-surface-dim hover:bg-primary/5 hover:text-primary rounded-xl text-[11px] font-semibold text-on-surface-variant border border-outline transition-all cursor-pointer"
                >
                  📐 Matematik Çalışma Metodu
                </button>
                <button
                  onClick={() => handleSendChatMessage('Sınav stresini nasıl yönetebilirim?')}
                  className="px-3 py-1.5 bg-surface-dim hover:bg-primary/5 hover:text-primary rounded-xl text-[11px] font-semibold text-on-surface-variant border border-outline transition-all cursor-pointer"
                >
                  💨 Stres ve Heyecan Kontrolü
                </button>
                <button
                  onClick={() => handleSendChatMessage('Sayısal derslerde zaman yetiştiremiyorum.')}
                  className="px-3 py-1.5 bg-surface-dim hover:bg-primary/5 hover:text-primary rounded-xl text-[11px] font-semibold text-on-surface-variant border border-outline transition-all cursor-pointer"
                >
                  ⏱️ Zaman Yetiştirememe Sorunu
                </button>
              </div>
            </div>

            {/* Chat Messages Container */}
            <div className="flex-1 overflow-y-auto border border-outline rounded-2xl p-4 space-y-4 bg-surface-bright pr-2 scrollbar-thin scroll-smooth">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={msg.id || idx}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary/5 text-primary border-primary/20 rounded-tr-none'
                      : 'bg-white border-outline text-on-surface rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text.split('\n').map((para, pIdx) => (
                      <p key={pIdx} className="mb-2 last:mb-0">
                        {para}
                      </p>
                    ))}
                  </div>
                  <span className="text-[9px] text-on-surface-variant/40 italic px-1">
                    {msg.role === 'user' ? 'Ben' : 'LGS Mentörü'} • {msg.timestamp}
                  </span>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex flex-col items-start gap-1 select-none">
                  <div className="p-4 bg-white border border-outline rounded-2xl rounded-tl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Box */}
            <div className="relative shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendChatMessage(chatInput);
                }}
                placeholder="Yapay zeka LGS mentörüne rehberlik sorusu sor..."
                className="w-full bg-surface-dim border border-outline rounded-2xl p-4 pr-14 text-xs sm:text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-primary font-medium"
              />
              <button
                onClick={() => handleSendChatMessage(chatInput)}
                disabled={!chatInput.trim()}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                Sor
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
