import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Search, 
  Timer, 
  FileText, 
  Video, 
  HelpCircle, 
  Sparkles, 
  X, 
  ChevronRight, 
  BookOpen 
} from 'lucide-react';
import { useFirebase } from './FirebaseContext';

interface HeaderResource {
  id: string;
  name: string;
  type: string;
  topic: string;
  folder?: string;
}

const HARDCODED_QUESTIONS = [
  {
    id: "12",
    title: "Üslü İfadeler Çarpım Sorusunu Çöz (Kolay)",
    text: "2³ · 2⁵ işleminin sonucu aşağıdakilerden hangisine eşittir?",
    difficulty: "Kolay"
  },
  {
    id: "42",
    title: "Depolama Kapasiteleri Matematik Sorusu (Orta)",
    text: "Bir veri depolama merkezinde bulunan sunucuların kapasiteleri 2'nin ve 5'in kuvvetleri şeklinde...",
    difficulty: "Orta"
  },
  {
    id: "87",
    title: "Uzaklık ve Işık Hızı Bilimsel Gösterim (Zor)",
    text: "Dünya'nın Güneş'e olan uzaklığı yaklaşık 1,5 · 10⁸ kilometredir. Işık hızı ise saniyede...",
    difficulty: "Zor"
  }
];

const HARDCODED_TOPICS = [
  {
    topic: "Üslü Sayılar",
    desc: "Formüller, negatif üs ve üssün üssü kavramları",
    prompt: "LGS Üslü Sayılar konusuyla ilgili bana 10 adet kritik kural ve sınav tüyosu yazar mısın?"
  },
  {
    topic: "Kareköklü İfadeler",
    desc: "Tam kare ilişkisi, karekök tahminleme kuralları",
    prompt: "Kareköklü ifadelerde kök dışına çıkarma ve katsayıyı içeri alma pratik yollarını anlatır mısın?"
  },
  {
    topic: "Çarpanlar ve Katlar",
    desc: "EBOB - EKOK formülleri, asal çarpanlar analizleri",
    prompt: "EBOB EKOK problemlerindeki ipucu kelimeleri nelerdir? Nasıl kolayca ayırt ederiz?"
  },
  {
    topic: "Cebirsel İfadeler ve Özdeşlikler",
    desc: "Çok karıştırılan Cebirsel İfadeler ve geometrik ispatlar",
    prompt: "Çok karıştırılan LGS Cebirsel İfadeler ve Özdeşlikler formüllerini en sade dille açıklar mısın?"
  }
];

export default function Header() {
  const { user, signInWithGoogle } = useFirebase();
  const [name, setName] = useState('Deniz Yılmaz');
  const [avatarSeed, setAvatarSeed] = useState('Felix');
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem('lgs_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.name) setName(parsed.name);
          if (parsed.avatarSeed) setAvatarSeed(parsed.avatarSeed);
        } catch (e) {
          // ignore
        }
      }
    };

    loadSettings();

    // Listen for custom dispatch events or storage updates to keep synchronized instantly
    window.addEventListener('storage', loadSettings);
    
    // Close search box on clicking outside
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    // Escape code
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowResults(false);
      }
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('storage', loadSettings);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const getResources = (): HeaderResource[] => {
    const saved = localStorage.getItem('lgs_resources');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: '1', name: 'Üslü Sayılar LGS Formülleri ve Özet.pdf', type: 'pdf', topic: 'Üslü Sayılar', folder: 'Ders Notları' },
      { id: '2', name: 'Kareköklü İfadeler - Tam Kare Sayı İlişkisi.pdf', type: 'pdf', topic: 'Kareköklü İfadeler', folder: 'Ders Notları' },
      { id: '7', name: 'Cebirsel İfadeler LGS Soru Çözümleri.mp4', type: 'video', topic: 'Cebirsel İfadeler', folder: 'Video Çözümler' },
      { id: '8', name: 'Ebob Ekok Kelime İpuçları ve Hızlı Taktikler.mp4', type: 'video', topic: 'Çarpanlar ve Katlar', folder: 'Video Çözümler' }
    ];
  };

  // Perform filtering
  const query = searchQuery.trim().toLocaleLowerCase('tr-TR');
  const matchedQuestions = query 
    ? HARDCODED_QUESTIONS.filter(q => q.title.toLocaleLowerCase('tr-TR').includes(query) || q.text.toLocaleLowerCase('tr-TR').includes(query))
    : [];

  const matchedResources = query 
    ? getResources().filter(r => r.name.toLocaleLowerCase('tr-TR').includes(query) || r.topic.toLocaleLowerCase('tr-TR').includes(query))
    : [];

  const matchedTopics = query 
    ? HARDCODED_TOPICS.filter(t => t.topic.toLocaleLowerCase('tr-TR').includes(query) || t.desc.toLocaleLowerCase('tr-TR').includes(query))
    : [];

  const hasResults = matchedQuestions.length > 0 || matchedResources.length > 0 || matchedTopics.length > 0;

  // Handle selections
  const selectQuestion = (id: string) => {
    window.dispatchEvent(new CustomEvent('select_question', { detail: { questionId: id } }));
    setSearchQuery('');
    setShowResults(false);
  };

  const selectResource = (id: string) => {
    window.dispatchEvent(new CustomEvent('select_resource', { detail: { fileId: id } }));
    setSearchQuery('');
    setShowResults(false);
  };

  const selectTopicPrompt = (prompt: string) => {
    window.dispatchEvent(new CustomEvent('ask_ai_mentor', { detail: { prompt } }));
    setSearchQuery('');
    setShowResults(false);
  };

  const handleAskAIWithSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      selectTopicPrompt(`"${searchQuery.trim()}" konusu/sorusu hakkında kafam karışık, bana detaylıca bu başlığı anlatıp LGS tüyoları verir misin?`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-outline z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold font-serif text-primary tracking-tight">LGS Mentor AI</span>
        
        {/* Interactive Search Bar wrapper container */}
        <div ref={containerRef} className="hidden md:block relative">
          <form 
            onSubmit={handleAskAIWithSearch}
            className="flex items-center bg-surface-dim px-3 py-1.5 rounded-md border border-outline w-72 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all"
          >
            <Search size={16} className="text-on-surface-variant flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Konu veya soru ara..."
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm ml-2 w-full placeholder:text-on-surface-variant/60 text-on-surface"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowResults(false);
                }}
                className="text-on-surface-variant/50 hover:text-on-surface p-0.5 rounded-md flex-shrink-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Floating Dropdown Results Card */}
          {searchQuery && showResults && (
            <div className="absolute top-11 left-0 w-[420px] bg-white border border-outline rounded-xl shadow-xl overflow-hidden z-50 animate-scale-up max-h-[460px] flex flex-col">
              
              {/* Header result info */}
              <div className="px-4 py-2 bg-surface-bright border-b border-outline flex justify-between items-center">
                <span className="text-[10px] font-mono tracking-wider text-primary font-bold uppercase">Arama Sonuçları</span>
                <span className="text-[9px] text-on-surface-variant/75">Escape ile Kapat</span>
              </div>

              {/* Scrollable results list */}
              <div className="overflow-y-auto p-2 space-y-3 flex-1">
                
                {/* 1. Category Questions */}
                {matchedQuestions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-primary tracking-wider uppercase px-2 font-mono">Sorular (Çalışma Havuzu)</span>
                    <div className="space-y-0.5">
                      {matchedQuestions.map(mq => (
                        <button
                          key={mq.id}
                          onClick={() => selectQuestion(mq.id)}
                          className="w-full text-left p-2 hover:bg-surface-dim rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer group"
                        >
                          <HelpCircle size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-primary group-hover:text-primary/80 truncate">{mq.title}</p>
                            <p className="text-[10px] text-on-surface-variant truncate">{mq.text}</p>
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            mq.difficulty === 'Zor' ? 'bg-rose-50 text-rose-600' :
                            mq.difficulty === 'Orta' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {mq.difficulty}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Category Resources */}
                {matchedResources.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-primary tracking-wider uppercase px-2 font-mono">Kütüphane (PDF & Videolar)</span>
                    <div className="space-y-0.5">
                      {matchedResources.map(mr => (
                        <button
                          key={mr.id}
                          onClick={() => selectResource(mr.id)}
                          className="w-full text-left p-2 hover:bg-surface-dim rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer group"
                        >
                          {mr.type === 'pdf' ? (
                            <FileText size={15} className="text-rose-600 mt-0.5 shrink-0" />
                          ) : (
                            <Video size={15} className="text-blue-600 mt-0.5 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-primary group-hover:text-primary/80 truncate">{mr.name}</p>
                            <p className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-wider">{mr.folder} • {mr.topic}</p>
                          </div>
                          <ChevronRight size={13} className="text-neutral-400 mt-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Category Math Topics (AI Action) */}
                {matchedTopics.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-primary tracking-wider uppercase px-2 font-mono">Yapay Zeka Çalışma Konuları</span>
                    <div className="space-y-0.5">
                      {matchedTopics.map(mt => (
                        <button
                          key={mt.topic}
                          onClick={() => selectTopicPrompt(mt.prompt)}
                          className="w-full text-left p-2 hover:bg-surface-dim rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer group"
                        >
                          <Sparkles size={14} className="text-purple-600 mt-0.5 shrink-0 animate-pulse" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-primary group-hover:text-primary/80">LGS {mt.topic} Analiz</p>
                            <p className="text-[10px] text-on-surface-variant">{mt.desc}</p>
                          </div>
                          <span className="text-[8px] bg-purple-50 text-purple-600 font-bold px-1.5 py-0.5 rounded uppercase self-start">AI Sor</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Fallback search when no category has entries */}
                {!hasResults && (
                  <div className="p-4 text-center space-y-3">
                    <p className="text-xs font-medium text-on-surface-variant">"{searchQuery}" aramasıyla eşleşen yerel veri bulunamadı.</p>
                    <button
                      onClick={handleAskAIWithSearch}
                      type="button"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                    >
                      <Sparkles size={13} className="animate-pulse" />
                      Yapay Zekaya Doğrudan Sor
                    </button>
                  </div>
                )}

              </div>

              {/* Bottom Quick Tips */}
              <div className="px-4 py-2 bg-surface-dim border-t border-outline text-[9px] text-on-surface-variant/80 flex items-center justify-between">
                <span>Sorular, ders özetleri veya videolar arasında canlı arar.</span>
                <span className="font-bold text-primary italic">LGS Mentor AI</span>
              </div>

            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-primary font-semibold bg-surface-dim border border-outline">
          <Timer size={16} />
          <span className="text-sm font-sans">24:15</span>
        </div>

        <button className="p-2 rounded-full hover:bg-surface-dim transition-colors text-on-surface-variant cursor-pointer">
          <Bell size={20} />
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-bold text-primary font-serif italic">{user.displayName || name}</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline bg-surface-dim">
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                alt={user.displayName || name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          <button 
            onClick={() => signInWithGoogle().then(u => {
              if (u) {
                alert(`Hoş geldin LGS Şampiyonu, ${u.displayName}! Bulut yedekleme aktifleşti.`);
              }
            })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm hover:shadow-md transition-all truncate"
          >
            <Sparkles size={11} className="shrink-0 animate-pulse text-yellow-300" />
            <span className="hidden xs:inline">Google ile Eşle</span>
            <span className="inline xs:hidden">Giriş Yap</span>
          </button>
        )}
      </div>
    </header>
  );
}
