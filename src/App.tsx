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
import type { Question, Message, Difficulty } from './types';

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

  const loadNewQuestion = useCallback(() => {
    let pool = questions;
    if (difficulty !== 'Hepsi') {
      pool = questions.filter(q => q.difficulty === difficulty);
    }
    if (pool.length === 0) pool = questions;
    
    const random = Math.floor(Math.random() * pool.length);
    setCurrentQuestion(pool[random]);
    setLastErrorAnalysis(undefined);
  }, [questions, difficulty]);

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectStreak(prev => prev + 1);
      setProgress(prev => Math.min(100, prev + 5));
      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'ai',
        text: 'Harika bir çözüm! Mantığı çok iyi kavradın. Bir sonraki soruya geçmeye hazır mısın?',
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
        text: `Yanlış cevap verdin ama sorun değil. Senin için detaylı bir hata analizi hazırladım. "${currentQuestion.errorType}" kısmına dikkat etmelisin. Tekrar deneyelim mi?`,
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

    // Simulated AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: 'Güzel bir soru! Bu adımda tabanların aynı olduğuna dikkat etmelisin. Eğer tabanlar aynıysa üsleri toplaman yeterli olacaktır.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  useEffect(() => {
    loadNewQuestion();
  }, [difficulty, loadNewQuestion]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <div className="flex pt-16 flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
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
          {activeTab === 'analiz' && <AnalysisView />}
          {activeTab === 'kaynaklar' && <ResourcesView />}
          {activeTab === 'ai-rehber' && <AIGuideView />}
          {activeTab === 'ayarlar' && <SettingsView />}
        </main>
        <AITutor
          messages={messages}
          onSendMessage={handleSendMessage}
          progress={progress}
          errorAnalysis={lastErrorAnalysis}
        />
      </div>
    </div>
  );
}
