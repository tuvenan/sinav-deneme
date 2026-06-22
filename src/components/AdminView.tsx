import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Sparkles, Check, Settings, TrendingUp, FolderOpen, 
  Upload, Zap, BookOpen, Users, Sliders, Database, Mic, Plus, 
  Trash2, Play, RefreshCw, CheckCircle, Search, Code, Cpu, Info, 
  ArrowRight, Save, LayoutGrid, Award, Server, AlertCircle, Palette, Image,
  ChevronUp, ChevronDown, Edit2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Question, Difficulty, SolveHistory, Message } from '../types';
import { LGS_SYLLABUS, buildQuestion } from '../utils/questionGenerator';
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
  const [adminTab, setAdminTab] = useState<'genel' | 'sorular' | 'ogrenci' | 'prompts' | 'stt-test' | 'bulut-log' | 'kaynaklar' | 'stil' | 'mufredat'>('genel');

  // Dynamic syllabus / curriculum süzgeçleri state (holds flat representation under the hood)
  const [syllabus, setSyllabus] = useState<{ subject: string; unit: string; topic: string }[]>(() => {
    const saved = localStorage.getItem('lgs_custom_syllabus');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse lgs_custom_syllabus:', e);
      }
    }
    return LGS_SYLLABUS;
  });

  // Unique Soru Bankaları state
  interface QuestionBank {
    id: string;
    name?: string;
    subject: string;
    unit: string;
    topic: string;
    createdAt: string;
  }

  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>(() => {
    const saved = localStorage.getItem('lgs_question_banks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse lgs_question_banks:', e);
      }
    }
    // Deep fallback parsing from syllabus to seed default question banks
    const uniqueCombos = LGS_SYLLABUS.filter(s => s.subject && s.unit && s.topic);
    return uniqueCombos.map((s, idx) => ({
      id: `bank-${idx}`,
      subject: s.subject,
      unit: s.unit,
      topic: s.topic,
      createdAt: new Date().toLocaleDateString('tr-TR')
    }));
  });

  const saveQuestionBanks = (updated: QuestionBank[]) => {
    setQuestionBanks(updated);
    localStorage.setItem('lgs_question_banks', JSON.stringify(updated));
  };

  // Selected Bank ID state
  const [selectedBankId, setSelectedBankId] = useState<string | null>(() => {
    return localStorage.getItem('lgs_selected_bank_id') || null;
  });

  // Watch syllabus and selectedBankId changes and dispatch lgs_syllabus_updated event to sync other views in real-time
  useEffect(() => {
    window.dispatchEvent(new Event('lgs_syllabus_updated'));
  }, [syllabus, selectedBankId]);

  // General tab quick inject states
  const [injectBankId, setInjectBankId] = useState<string>('');
  const [injectSubject, setInjectSubject] = useState<string>('Matematik');
  const [injectUnit, setInjectUnit] = useState<string>('Üslü İfadeler');
  const [injectTopic, setInjectTopic] = useState<string>('Üssün Üssü Kuralları');

  // Synchronize Hızlı Veri Enjeksiyonu defaults with syllabus changes
  useEffect(() => {
    const validSubjects = Array.from(new Set(syllabus.map(s => s.subject).filter(Boolean)));
    if (validSubjects.length > 0) {
      if (!injectSubject || !validSubjects.includes(injectSubject)) {
        const firstSub = validSubjects[0];
        setInjectSubject(firstSub);
        
        const validUnits = Array.from(new Set(syllabus.filter(s => s.subject === firstSub).map(s => s.unit).filter(Boolean)));
        if (validUnits.length > 0) {
          setInjectUnit(validUnits[0]);
          const validTopics = Array.from(new Set(syllabus.filter(s => s.subject === firstSub && s.unit === validUnits[0]).map(s => s.topic).filter(Boolean)));
          if (validTopics.length > 0) {
            setInjectTopic(validTopics[0]);
          } else {
            setInjectTopic('');
          }
        } else {
          setInjectUnit('');
          setInjectTopic('');
        }
      } else {
        const validUnits = Array.from(new Set(syllabus.filter(s => s.subject === injectSubject).map(s => s.unit).filter(Boolean)));
        if (validUnits.length > 0) {
          if (!injectUnit || !validUnits.includes(injectUnit)) {
            const firstUnit = validUnits[0];
            setInjectUnit(firstUnit);
            const validTopics = Array.from(new Set(syllabus.filter(s => s.subject === injectSubject && s.unit === firstUnit).map(s => s.topic).filter(Boolean)));
            if (validTopics.length > 0) {
              setInjectTopic(validTopics[0]);
            } else {
              setInjectTopic('');
            }
          } else {
            const validTopics = Array.from(new Set(syllabus.filter(s => s.subject === injectSubject && s.unit === injectUnit).map(s => s.topic).filter(Boolean)));
            if (validTopics.length > 0) {
              if (!injectTopic || !validTopics.includes(injectTopic)) {
                setInjectTopic(validTopics[0]);
              }
            } else {
              setInjectTopic('');
            }
          }
        } else {
          setInjectUnit('');
          setInjectTopic('');
        }
      }
    }
  }, [syllabus, injectSubject, injectUnit, injectTopic]);

  const handleInjectBankIdChange = (bankId: string) => {
    setInjectBankId(bankId);
    if (bankId) {
      const bank = questionBanks.find(b => b.id === bankId);
      if (bank) {
        setInjectSubject(bank.subject);
        setInjectUnit(bank.unit);
        setInjectTopic(bank.topic);
      }
    }
  };

  // State for hierarchical bank management
  const [newBankNameInput, setNewBankNameInput] = useState<string>('');
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editingBankNameVal, setEditingBankNameVal] = useState<string>('');

  const handleAddHierarchicalBank = (ders: string, unite: string, topic: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = questionBanks.some(b => 
      b.subject === ders && 
      b.unit === unite && 
      b.topic === topic && 
      b.name?.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      addLog('warn', 'QUESTION_BANK', `"${trimmed}" isimli bir soru bankası bu alt konuda zaten mevcut.`);
      alert(`"${trimmed}" isimli bir soru bankası bu alt konuda zaten mevcut.`);
      return;
    }
    const newBank: QuestionBank = {
      id: `bank-custom-${Date.now()}`,
      name: trimmed,
      subject: ders,
      unit: unite,
      topic: topic,
      createdAt: new Date().toLocaleDateString('tr-TR')
    };
    const updated = [...questionBanks, newBank];
    saveQuestionBanks(updated);
    addLog('success', 'QUESTION_BANK', `Yeni Soru Bankası oluşturuldu: ${trimmed}`);
  };

  const handleEditBankName = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated = questionBanks.map(b => b.id === id ? { ...b, name: trimmed } : b);
    saveQuestionBanks(updated);
    addLog('success', 'QUESTION_BANK', `Soru bankası adı güncellendi: ${trimmed}`);
  };

  // Edit states for syllabus elements
  const [editingDers, setEditingDers] = useState<string | null>(null);
  const [editingDersVal, setEditingDersVal] = useState<string>('');

  const [editingUnite, setEditingUnite] = useState<string | null>(null);
  const [editingUniteVal, setEditingUniteVal] = useState<string>('');

  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [editingTopicVal, setEditingTopicVal] = useState<string>('');

  // Custom dialog and popup state for confirmation alerts
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'alert';
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
  } | null>(null);

  const triggerConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    confirmLabel?: string, 
    cancelLabel?: string
  ) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      confirmLabel,
      cancelLabel,
      onConfirm: () => {
        onConfirm();
        setModalConfig(null);
      }
    });
  };

  const triggerAlert = (title: string, message: string) => {
    setModalConfig({
      isOpen: true,
      type: 'alert',
      title,
      message
    });
  };

  // State to toggle form overlay inside a question bank
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // States to add a new question bank
  const [newBankSub, setNewBankSub] = useState('');
  const [newBankUni, setNewBankUni] = useState('');
  const [newBankTop, setNewBankTop] = useState('');

  const handleAddQuestionBank = () => {
    if (!newBankSub || !newBankUni || !newBankTop) {
      alert('Soru Bankası oluşturmak için Ders, Ünite ve Alt Konu seçmelisiniz!');
      return;
    }
    const exists = questionBanks.some(b => b.subject === newBankSub && b.unit === newBankUni && b.topic === newBankTop);
    if (exists) {
      alert('Seçtiğiniz ders, ünite ve alt konuya ait bir Soru Bankası zaten mevcut!');
      return;
    }
    const newBank: QuestionBank = {
      id: `bank-custom-${Date.now()}`,
      subject: newBankSub,
      unit: newBankUni,
      topic: newBankTop,
      createdAt: new Date().toLocaleDateString('tr-TR')
    };
    const updated = [...questionBanks, newBank];
    saveQuestionBanks(updated);
    selectBank(newBank.id);
    addLog('success', 'QUESTION_BANK', `Yeni Soru Bankası oluşturuldu: ${newBankSub} > ${newBankUni} > ${newBankTop}`);
    // Clear selections
    setNewBankSub('');
    setNewBankUni('');
    setNewBankTop('');
  };

  const handleRemoveQuestionBank = (id: string) => {
    const bank = questionBanks.find(b => b.id === id);
    if (!bank) return;
    triggerConfirm(
      'Soru Bankasını Sil',
      `"${bank.subject} > ${bank.unit} > ${bank.topic}" Soru Bankasını silmek istediğinize emin misiniz?\n\nNot: Bankanın kendisi silinecektir. Soru silme seçeneği form üzerinden yönetilir.`,
      () => {
        const updated = questionBanks.filter(b => b.id !== id);
        saveQuestionBanks(updated);
        if (selectedBankId === id) {
          selectBank(null);
        }
        addLog('warn', 'QUESTION_BANK', `Soru Bankası kaldırıldı: ${bank.subject} > ${bank.unit} > ${bank.topic}`);
      }
    );
  };

  const selectBank = (id: string | null) => {
    setSelectedBankId(id);
    if (id) {
      localStorage.setItem('lgs_selected_bank_id', id);
    } else {
      localStorage.removeItem('lgs_selected_bank_id');
    }
    setShowQuestionForm(false);
    resetQuestionForm();
  };

  // Curriculum Tab specific state
  const [selectedMufredatDers, setSelectedMufredatDers] = useState<string>('');
  const [selectedMufredatUnite, setSelectedMufredatUnite] = useState<string>('');
  const [selectedMufredatTopic, setSelectedMufredatTopic] = useState<string>('');
  
  const [newDersInput, setNewDersInput] = useState('');
  const [newUniteInput, setNewUniteInput] = useState('');
  const [newTopicInput, setNewTopicInput] = useState('');

  // 1. Ders Ekleme
  const handleAddDers = (ders: string) => {
    const trimmed = ders.trim();
    if (!trimmed) return;
    const exists = syllabus.some(s => s.subject.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      addLog('warn', 'MÜFREDAT', `"${trimmed}" dersi zaten mevcut.`);
      return;
    }
    const updated = [...syllabus, { subject: trimmed, unit: '', topic: '' }];
    setSyllabus(updated);
    localStorage.setItem('lgs_custom_syllabus', JSON.stringify(updated));
    setSelectedMufredatDers(trimmed);
    setSelectedMufredatUnite('');
    addLog('success', 'MÜFREDAT', `Yeni ders eklendi: ${trimmed}`);
  };

  // 2. Ders Çıkarma
  const handleRemoveDers = (ders: string) => {
    triggerConfirm(
      'Dersi Sil',
      `"${ders}" dersini ve buna bağlı TÜM ünite ile alt konuları silme işlemini onaylıyor musunuz?`,
      () => {
        const updated = syllabus.filter(s => s.subject !== ders);
        setSyllabus(updated);
        localStorage.setItem('lgs_custom_syllabus', JSON.stringify(updated));
        if (selectedMufredatDers === ders) {
          setSelectedMufredatDers('');
          setSelectedMufredatUnite('');
        }
        addLog('warn', 'MÜFREDAT', `Ders komple silindi: ${ders}`);
      }
    );
  };

  // 3. Ünite Ekleme
  const handleAddUnite = (ders: string, unite: string) => {
    const trimmedUnite = unite.trim();
    if (!ders || !trimmedUnite) return;
    const exists = syllabus.some(s => s.subject === ders && s.unit.toLowerCase() === trimmedUnite.toLowerCase());
    if (exists) {
      addLog('warn', 'MÜFREDAT', `"${trimmedUnite}" ünitesi bu derste zaten mevcut.`);
      return;
    }
    const filtered = syllabus.filter(s => !(s.subject === ders && s.unit === '' && s.topic === ''));
    const updated = [...filtered, { subject: ders, unit: trimmedUnite, topic: '' }];
    setSyllabus(updated);
    localStorage.setItem('lgs_custom_syllabus', JSON.stringify(updated));
    setSelectedMufredatUnite(trimmedUnite);
    addLog('success', 'MÜFREDAT', `"${ders}" dersine yeni ünite eklendi: ${trimmedUnite}`);
  };

  // 4. Ünite Çıkarma
  const handleRemoveUnite = (ders: string, unite: string) => {
    triggerConfirm(
      'Üniteyi Sil',
      `"${unite}" ünitesini ve buna bağlı TÜM alt konuları silmek istediğinize emin misiniz?`,
      () => {
        let filtered = syllabus.filter(s => !(s.subject === ders && s.unit === unite));
        const hasOtherRows = filtered.some(s => s.subject === ders);
        if (!hasOtherRows) {
          filtered.push({ subject: ders, unit: '', topic: '' });
        }
        setSyllabus(filtered);
        localStorage.setItem('lgs_custom_syllabus', JSON.stringify(filtered));
        if (selectedMufredatUnite === unite) {
          setSelectedMufredatUnite('');
        }
        addLog('warn', 'MÜFREDAT', `Ünite silindi: ${ders} > ${unite}`);
      }
    );
  };

  // 5. Alt Konu Ekleme
  const handleAddTopic = (ders: string, unite: string, topic: string) => {
    const trimmedTopic = topic.trim();
    if (!ders || !unite || !trimmedTopic) return;
    const exists = syllabus.some(s => s.subject === ders && s.unit === unite && s.topic.toLowerCase() === trimmedTopic.toLowerCase());
    if (exists) {
      addLog('warn', 'MÜFREDAT', `"${trimmedTopic}" alt konusu bu ünitede zaten mevcut.`);
      return;
    }
    const filtered = syllabus.filter(s => !(s.subject === ders && s.unit === unite && s.topic === ''));
    const updated = [...filtered, { subject: ders, unit: unite, topic: trimmedTopic }];
    setSyllabus(updated);
    localStorage.setItem('lgs_custom_syllabus', JSON.stringify(updated));
    addLog('success', 'MÜFREDAT', `Yeni alt konu eklendi: ${ders} > ${unite} > ${trimmedTopic}`);
  };

  // 6. Alt Konu Çıkarma
  const handleRemoveTopic = (ders: string, unite: string, topic: string) => {
    triggerConfirm(
      'Alt Konuyu Sil',
      `"${topic}" alt konusunu silmek istediğinize emin misiniz?`,
      () => {
        let filtered = syllabus.filter(s => !(s.subject === ders && s.unit === unite && s.topic === topic));
        const hasOtherRows = filtered.some(s => s.subject === ders && s.unit === unite);
        if (!hasOtherRows) {
          filtered.push({ subject: ders, unit: unite, topic: '' });
        }
        setSyllabus(filtered);
        localStorage.setItem('lgs_custom_syllabus', JSON.stringify(filtered));
        addLog('warn', 'MÜFREDAT', `Alt konu silindi: ${ders} > ${unite} > ${topic}`);
      }
    );
  };

  // 7. Ders Sırasını Değiştirme
  const handleMoveDers = (ders: string, direction: 'up' | 'down') => {
    const dersList = Array.from(new Set(syllabus.map(s => s.subject).filter(Boolean))) as string[];
    const index = dersList.indexOf(ders);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === dersList.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newDersList = [...dersList];
    newDersList[index] = dersList[targetIndex];
    newDersList[targetIndex] = ders;

    // Reconstruct syllabus ordered by newDersList
    const newSyllabus: typeof syllabus = [];
    newDersList.forEach(subjectName => {
      const matchingRows = syllabus.filter(s => s.subject === subjectName);
      newSyllabus.push(...matchingRows);
    });
    const otherRows = syllabus.filter(s => !s.subject);
    newSyllabus.push(...otherRows);

    setSyllabus(newSyllabus);
    localStorage.setItem('lgs_custom_syllabus', JSON.stringify(newSyllabus));
    addLog('info', 'MÜFREDAT', `Ders sırası değiştirildi: ${ders} (${direction === 'up' ? 'Yukarı' : 'Aşağı'})`);
  };

  // 8. Ünite Sırasını Değiştirme
  const handleMoveUnite = (ders: string, unite: string, direction: 'up' | 'down') => {
    const unitList = Array.from(new Set(syllabus.filter(s => s.subject === ders).map(s => s.unit).filter(Boolean))) as string[];
    const index = unitList.indexOf(unite);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === unitList.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newUnitList = [...unitList];
    newUnitList[index] = unitList[targetIndex];
    newUnitList[targetIndex] = unite;

    // Get matching unit rows for this ders
    const dersRowsForSyllabus: typeof syllabus = [];
    newUnitList.forEach(unitName => {
      const matchingUnitRows = syllabus.filter(s => s.subject === ders && s.unit === unitName);
      dersRowsForSyllabus.push(...matchingUnitRows);
    });
    const emptyUnitRows = syllabus.filter(s => s.subject === ders && !s.unit);
    dersRowsForSyllabus.push(...emptyUnitRows);

    // Assembly with correct order of other subjects
    const orderOfDers = Array.from(new Set(syllabus.map(s => s.subject).filter(Boolean))) as string[];
    const finalSyllabus: typeof syllabus = [];
    orderOfDers.forEach(subj => {
      if (subj === ders) {
        finalSyllabus.push(...dersRowsForSyllabus);
      } else {
        finalSyllabus.push(...syllabus.filter(s => s.subject === subj));
      }
    });
    const untracked = syllabus.filter(s => !s.subject);
    finalSyllabus.push(...untracked);

    setSyllabus(finalSyllabus);
    localStorage.setItem('lgs_custom_syllabus', JSON.stringify(finalSyllabus));
    addLog('info', 'MÜFREDAT', `Ünite sırası değiştirildi: ${unite} (${direction === 'up' ? 'Yukarı' : 'Aşağı'})`);
  };

  // 9. Alt Konu Sırasını Değiştirme
  const handleMoveTopic = (ders: string, unite: string, topic: string, direction: 'up' | 'down') => {
    const topicList = Array.from(new Set(syllabus.filter(s => s.subject === ders && s.unit === unite).map(s => s.topic).filter(Boolean))) as string[];
    const index = topicList.indexOf(topic);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === topicList.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newTopicList = [...topicList];
    newTopicList[index] = topicList[targetIndex];
    newTopicList[targetIndex] = topic;

    // Reconstruct topics for this unit
    const unitRowsForSyllabus: typeof syllabus = [];
    newTopicList.forEach(topicName => {
      const matchingTopicRows = syllabus.filter(s => s.subject === ders && s.unit === unite && s.topic === topicName);
      unitRowsForSyllabus.push(...matchingTopicRows);
    });
    const emptyTopicRows = syllabus.filter(s => s.subject === ders && s.unit === unite && !s.topic);
    unitRowsForSyllabus.push(...emptyTopicRows);

    // Assemble final syllabus
    const finalSyllabus: typeof syllabus = [];
    const orderOfDers = Array.from(new Set(syllabus.map(s => s.subject).filter(Boolean))) as string[];
    orderOfDers.forEach(subj => {
      if (subj === ders) {
        const orderOfUnits = Array.from(new Set(syllabus.filter(s => s.subject === ders).map(s => s.unit).filter(Boolean))) as string[];
        orderOfUnits.forEach(uni => {
          if (uni === unite) {
            finalSyllabus.push(...unitRowsForSyllabus);
          } else {
            finalSyllabus.push(...syllabus.filter(s => s.subject === ders && s.unit === uni));
          }
        });
        const emptyUnitRows = syllabus.filter(s => s.subject === ders && !s.unit);
        finalSyllabus.push(...emptyUnitRows);
      } else {
        finalSyllabus.push(...syllabus.filter(s => s.subject === subj));
      }
    });
    const untracked = syllabus.filter(s => !s.subject);
    finalSyllabus.push(...untracked);

    setSyllabus(finalSyllabus);
    localStorage.setItem('lgs_custom_syllabus', JSON.stringify(finalSyllabus));
    addLog('info', 'MÜFREDAT', `Alt Konu sırası değiştirildi: ${topic} (${direction === 'up' ? 'Yukarı' : 'Aşağı'})`);
  };

  // 10. Sitede Yayınlama (Publish)
  const handlePublishSyllabus = () => {
    triggerConfirm(
      'Sitede Yayınla & Güncelle',
      'Belirlediğiniz ders, ünite ve alt konu sıralama yapısını canlı sitede yayınlamak istiyor musunuz? Bu işlem öğrencilerin ekranındaki tüm filtre süzgeçlerini anlık olarak güncelleyecektir.',
      () => {
        localStorage.setItem('lgs_published_syllabus', JSON.stringify(syllabus));
        localStorage.setItem('lgs_custom_syllabus', JSON.stringify(syllabus));
        triggerAlert(
          'Müfredat Canlı Sitede Yayınlandı',
          'Tebrikler! Belirlediğiniz ders, ünite ve alt konu sıralama yapısı başarıyla yayına alındı. Sitedeki çalışma ve test çözme alanlarındaki filtre süzgeçleri anlık olarak dinamik şekilde güncellenmiştir.'
        );
        addLog('success', 'PUBLISH', 'Müfredat yapısı ve sıralaması canlı sitede yayınlandı.');
        
        // Dispatch events to refresh parent components
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('theme-changed'));
        window.dispatchEvent(new Event('lgs_syllabus_updated'));
      },
      'Evet, Yayınla',
      'Hayır, Vazgeç'
    );
  };

  // 11. Hiyerarşik Müfredat Editör Handlers
  const handleEditDers = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    const exists = syllabus.some(s => s.subject.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      addLog('warn', 'MÜFREDAT', `"${trimmed}" isimli bir ders zaten mevcut.`);
      return;
    }
    const updatedSyllabus = syllabus.map(s => s.subject === oldName ? { ...s, subject: trimmed } : s);
    setSyllabus(updatedSyllabus);
    localStorage.setItem('lgs_custom_syllabus', JSON.stringify(updatedSyllabus));

    const updatedQuestions = questions.map(q => q.subject === oldName ? { ...q, subject: trimmed } : q);
    setQuestions(updatedQuestions);
    saveQuestionsToStorage(updatedQuestions);

    const updatedBanks = questionBanks.map(b => b.subject === oldName ? { ...b, subject: trimmed } : b);
    saveQuestionBanks(updatedBanks);

    if (selectedMufredatDers === oldName) {
      setSelectedMufredatDers(trimmed);
    }
    addLog('success', 'MÜFREDAT', `Ders adı güncellendi: ${oldName} -> ${trimmed}`);
  };

  const handleEditUnite = (ders: string, oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    const exists = syllabus.some(s => s.subject === ders && s.unit.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      addLog('warn', 'MÜFREDAT', `"${trimmed}" ünitesi bu derste zaten mevcut.`);
      return;
    }
    const updatedSyllabus = syllabus.map(s => (s.subject === ders && s.unit === oldName) ? { ...s, unit: trimmed } : s);
    setSyllabus(updatedSyllabus);
    localStorage.setItem('lgs_custom_syllabus', JSON.stringify(updatedSyllabus));

    const updatedQuestions = questions.map(q => (q.subject === ders && q.unit === oldName) ? { ...q, unit: trimmed } : q);
    setQuestions(updatedQuestions);
    saveQuestionsToStorage(updatedQuestions);

    const updatedBanks = questionBanks.map(b => (b.subject === ders && b.unit === oldName) ? { ...b, unit: trimmed } : b);
    saveQuestionBanks(updatedBanks);

    if (selectedMufredatUnite === oldName) {
      setSelectedMufredatUnite(trimmed);
    }
    addLog('success', 'MÜFREDAT', `Ünite adı güncellendi: ${oldName} -> ${trimmed}`);
  };

  const handleEditTopic = (ders: string, unite: string, oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    const exists = syllabus.some(s => s.subject === ders && s.unit === unite && s.topic.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      addLog('warn', 'MÜFREDAT', `"${trimmed}" alt konusu bu ünitede zaten mevcut.`);
      return;
    }
    const updatedSyllabus = syllabus.map(s => (s.subject === ders && s.unit === unite && s.topic === oldName) ? { ...s, topic: trimmed } : s);
    setSyllabus(updatedSyllabus);
    localStorage.setItem('lgs_custom_syllabus', JSON.stringify(updatedSyllabus));

    const updatedQuestions = questions.map(q => (q.subject === ders && q.unit === unite && q.topic === oldName) ? { ...q, topic: trimmed } : q);
    setQuestions(updatedQuestions);
    saveQuestionsToStorage(updatedQuestions);

    const updatedBanks = questionBanks.map(b => (b.subject === ders && b.unit === unite && b.topic === oldName) ? { ...b, topic: trimmed } : b);
    saveQuestionBanks(updatedBanks);

    addLog('success', 'MÜFREDAT', `Alt konu adı güncellendi: ${oldName} -> ${trimmed}`);
  };

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
  const [qSubject, setQSubject] = useState('Matematik');
  const [qUnit, setQUnit] = useState('Üslü İfadeler');
  const [qTopic, setQTopic] = useState('Üslü Sayılarda Çarpma');

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
    setQSubject(q.subject || 'Matematik');
    setQUnit(q.unit || 'Üslü İfadeler');
    setQTopic(q.topic || 'Üslü Sayılarda Çarpma');
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

    // Check if we have an active question bank selected to auto-bind values
    const activeBank = questionBanks.find(b => b.id === selectedBankId);
    const finalSubject = activeBank ? activeBank.subject : (qSubject.trim() || 'Matematik');
    const finalUnit = activeBank ? activeBank.unit : (qUnit.trim() || 'Üslü İfadeler');
    const finalTopic = activeBank ? activeBank.topic : (qTopic.trim() || 'Üslü Sayılarda Çarpma');

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
      imageUrl: qImageUrl.trim() || undefined,
      subject: finalSubject,
      unit: finalUnit,
      topic: finalTopic
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
    if (currentQuestion && currentQuestion.id === targetId) {
      setCurrentQuestion(updatedQuestion);
    }

    // Reset fields
    resetQuestionForm();
    setShowQuestionForm(false);
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
    setQSubject('Matematik');
    setQUnit('Üslü İfadeler');
    setQTopic('Üslü Sayılarda Çarpma');
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert('Sistemde en az 1 adet soru kalmalıdır!');
      return;
    }
    triggerConfirm(
      'Soruyu Sil',
      'Bu soruyu havuzdan kalıcı olarak silmek istediğinizden emin misiniz?',
      () => {
        const filtered = questions.filter(q => q.id !== id);
        setQuestions(filtered);
        saveQuestionsToStorage(filtered);
        addLog('warn', 'QUESTION', `"${id}" ID'li soru başarıyla silindi.`);
        if (currentQuestion.id === id) {
          setCurrentQuestion(filtered[0]);
        }
      }
    );
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
    <>
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
            EduSınav Yönetim Merkezi
          </h1>
          <p className="text-xs text-on-surface-variant font-medium mt-1 leading-relaxed">
            Sistem parametrelerini kalibre edin, soru havuzunu yönetin ve diğer ders içeriklerini güncelleyin.
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

        {/* Müfredat Süzgeçleri Yönetimi */}
        <button
          onClick={() => setAdminTab('mufredat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            adminTab === 'mufredat' ? 'bg-[#059669] text-white shadow-sm' : 'text-on-surface-variant hover:bg-neutral-100 hover:text-primary'
          }`}
        >
          <LayoutGrid size={14} className="shrink-0" />
          <span>Müfredat Süzgeçleri ({syllabus.length})</span>
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
                  <div className="p-4 bg-surface-dim/40 rounded-xl border border-outline/50 space-y-3">
                    <h3 className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-500" />
                      <span>Hızlı Veri Enjeksiyonu (Süzgeçli)</span>
                    </h3>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Belirlediğiniz ders, ünite, alt konu ve soru bankası süzgeçlerine göre akıllı LGS soruları üreterek havuza anlık enjekte eder.
                    </p>

                    <div className="space-y-2 py-1 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-primary font-bold block uppercase tracking-wider">İsteğe Bağlı Soru Bankası</label>
                          <select
                            value={injectBankId}
                            onChange={(e) => handleInjectBankIdChange(e.target.value)}
                            className="w-full bg-white border border-outline rounded-xl p-2 text-[11px] text-primary font-bold focus:outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="">-- Genel Soru Havuzu --</option>
                            {questionBanks.map(b => (
                              <option key={b.id} value={b.id}>{b.name || `${b.subject} -> ${b.unit}`}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-primary font-bold block uppercase tracking-wider">Hedef Ders</label>
                          <select
                            value={injectSubject}
                            onChange={(e) => {
                              setInjectSubject(e.target.value);
                              setInjectUnit('');
                              setInjectTopic('');
                            }}
                            className="w-full bg-white border border-outline rounded-xl p-2 text-[11px] text-primary font-bold focus:outline-none focus:border-primary cursor-pointer"
                          >
                            {Array.from(new Set(syllabus.map(s => s.subject).filter(Boolean))).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-primary font-bold block uppercase tracking-wider">Hedef Ünite</label>
                          <select
                            value={injectUnit}
                            onChange={(e) => {
                              setInjectUnit(e.target.value);
                              setInjectTopic('');
                            }}
                            className="w-full bg-white border border-outline rounded-xl p-2 text-[11px] text-primary font-bold focus:outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="">-- Ünite Seçin --</option>
                            {Array.from(new Set(syllabus.filter(s => s.subject === injectSubject).map(s => s.unit).filter(Boolean))).map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-primary font-bold block uppercase tracking-wider">Alt Konu (Kazanım)</label>
                          <select
                            value={injectTopic}
                            onChange={(e) => setInjectTopic(e.target.value)}
                            className="w-full bg-white border border-outline rounded-xl p-2 text-[11px] text-primary font-bold focus:outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="">-- Konu Seçin --</option>
                            {Array.from(new Set(syllabus.filter(s => s.subject === injectSubject && s.unit === injectUnit).map(s => s.topic).filter(Boolean))).map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!injectSubject || !injectUnit || !injectTopic) {
                          alert('Lütfen soru üretilebilmesi için Ders, Ünite ve Alt Konu seçiniz!');
                          return;
                        }
                        
                        const topicQuestionsCount = questions.filter(q => 
                          q.subject === injectSubject && 
                          q.unit === injectUnit && 
                          q.topic === injectTopic
                        ).length;

                        const index = topicQuestionsCount + 1;
                        const difficulty: Difficulty = index <= 6 ? 'Kolay' : index <= 14 ? 'Orta' : 'Zor';
                        const subjectPrefix = injectSubject.substring(0, 3).toUpperCase();
                        const topicSuffix = injectTopic.replace(/\s+/g, '').substring(0, 5).toUpperCase();
                        const qId = `${subjectPrefix}-${topicSuffix}-${100 + index}`;

                        const newQ = buildQuestion(injectSubject, injectUnit, injectTopic, index, difficulty, qId);
                        
                        const updated = [...questions, newQ];
                        setQuestions(updated);
                        saveQuestionsToStorage(updated);
                        
                        // Fire event so workspace gets it instantly
                        window.dispatchEvent(new Event('lgs_syllabus_updated'));

                        addLog('success', 'INJECT', `Akıllı Soru Üretildi ve Enjekte Edildi: ${injectSubject} > ${injectUnit} > ${injectTopic}`);
                        alert(`"${injectSubject} > ${injectUnit} > ${injectTopic}" kategorisine ait "${difficulty}" zorluk derecesinde LGS tabanlı akıllı test sorusu başarıyla üretildi ve soru havuzuna eklendi!`);
                      }}
                      className="px-4 py-2 bg-[#059669] hover:bg-emerald-700 text-white text-[10px] uppercase font-bold tracking-wider rounded-xl shadow-md transition-all cursor-pointer w-full text-center"
                    >
                      Seçili Süzgece Göre Akıllı Soru Enjekte Et
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

          {/* 2. QUESTIONS MANAGER TAB PANEL (SORU BANKALARI YÖNETİM SİSTEMİ) */}
          {adminTab === 'sorular' && (
            <div className="space-y-6">
              
              {/* Main Two-Column Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                
                {/* SOL KOLON: SORU BANKALARI LİSTE VE OLUŞTURMA */}
                <div className="xl:col-span-1 space-y-6">
                  
                  {/* Yeni Soru Bankası Oluşturma Kartı */}
                  <div className="bg-white border border-outline rounded-3xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-light-outline pb-2 flex items-center gap-1.5">
                      <Plus size={14} className="text-[#059669]" />
                      <span>Yeni Soru Bankası Oluştur</span>
                    </h3>

                    <div className="space-y-3 text-xs font-semibold">
                      
                      {/* Ders Seçiçi */}
                      <div className="space-y-1.5">
                        <label className="text-primary block text-[11px] uppercase tracking-wider">Müfredat Dersi</label>
                        <select
                          value={newBankSub}
                          onChange={(e) => {
                            setNewBankSub(e.target.value);
                            setNewBankUni('');
                            setNewBankTop('');
                          }}
                          className="w-full bg-surface-dim border border-outline rounded-xl p-2.5 text-xs text-primary font-bold focus:outline-none focus:border-primary"
                        >
                          <option value="">-- Ders Seçiniz --</option>
                          {Array.from(new Set(syllabus.map(s => s.subject).filter(Boolean))).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Ünite Seçici */}
                      <div className="space-y-1.5">
                        <label className="text-primary block text-[11px] uppercase tracking-wider">Ders Ünitesi</label>
                        <select
                          value={newBankUni}
                          disabled={!newBankSub}
                          onChange={(e) => {
                            setNewBankUni(e.target.value);
                            setNewBankTop('');
                          }}
                          className="w-full bg-surface-dim border border-outline rounded-xl p-2.5 text-xs text-primary font-bold focus:outline-none focus:border-primary disabled:opacity-50"
                        >
                          <option value="">-- Ünite Seçiniz --</option>
                          {Array.from(new Set(syllabus.filter(s => s.subject === newBankSub).map(s => s.unit).filter(Boolean))).map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>

                      {/* Alt Konu Seçici */}
                      <div className="space-y-1.5">
                        <label className="text-primary block text-[11px] uppercase tracking-wider">Alt Konu / Kazanım</label>
                        <select
                          value={newBankTop}
                          disabled={!newBankUni}
                          onChange={(e) => setNewBankTop(e.target.value)}
                          className="w-full bg-surface-dim border border-outline rounded-xl p-2.5 text-xs text-primary font-bold focus:outline-none focus:border-primary disabled:opacity-50"
                        >
                          <option value="">-- Alt Konu Seçiniz --</option>
                          {Array.from(new Set(syllabus.filter(s => s.subject === newBankSub && s.unit === newBankUni).map(s => s.topic).filter(Boolean))).map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={handleAddQuestionBank}
                        disabled={!newBankSub || !newBankUni || !newBankTop}
                        className="w-full py-2.5 bg-[#059669] hover:bg-emerald-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Plus size={14} />
                        <span>Soru Bankasını Ekle</span>
                      </button>

                    </div>
                  </div>

                  {/* Soru Bankaları Listesi */}
                  <div className="bg-white border border-outline rounded-3xl p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-light-outline pb-2 flex justify-between items-center">
                      <span>Mevcut Soru Bankaları</span>
                      <span className="text-[10px] font-mono bg-neutral-100 text-primary border border-outline rounded-full px-2 py-0.5">
                        {questionBanks.length} Adet
                      </span>
                    </h3>

                    {/* Scrollable list */}
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {questionBanks.map((bank) => {
                        const isSelected = selectedBankId === bank.id;
                        // Calculate total questions in this bank
                        const bankCount = questions.filter(q => 
                          q.subject === bank.subject && 
                          q.unit === bank.unit && 
                          q.topic === bank.topic
                        ).length;

                        return (
                          <div
                            key={bank.id}
                            onClick={() => selectBank(bank.id)}
                            className={`p-3 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between space-y-2 relative text-left ${
                              isSelected
                                ? 'border-[#059669] bg-[#059669]/5 shadow-sm'
                                : 'border-outline bg-white hover:bg-neutral-50/50'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <span className="bg-emerald-50 text-[#059669] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-100">
                                  {bank.subject}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveQuestionBank(bank.id);
                                  }}
                                  className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all shrink-0 cursor-pointer"
                                  title="Soru Bankasını Sil"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                              <h4 className="text-xs font-serif font-black text-primary line-clamp-1">{bank.unit}</h4>
                              <p className="text-[10px] text-on-surface-variant leading-normal font-medium line-clamp-1">{bank.topic}</p>
                            </div>

                            {/* Badge count */}
                            <div className="flex items-center justify-between pt-1 border-t border-dashed border-outline-variant text-[9px] font-mono font-bold text-on-surface-variant/70">
                              <span>Eklenme: {bank.createdAt || 'Varsayılan'}</span>
                              <span className="bg-neutral-100 p-1 px-2 rounded-full font-sans font-black text-primary">
                                {bankCount} Soru
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {questionBanks.length === 0 && (
                        <div className="p-6 text-center border border-dashed border-outline rounded-2xl bg-neutral-50/50 space-y-1">
                          <BookOpen size={16} className="text-on-surface-variant/40 mx-auto" />
                          <p className="text-[11px] text-on-surface-variant font-bold">Herhangi bir soru bankası bulunamadı.</p>
                          <p className="text-[9px] text-on-surface-variant/70">Yukarıdaki form aracılığıyla hemen bir tane tanımlayın.</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* SAĞ KOLON: SEÇİLİ SORU BANKASININ DETAYLARI VE SORU EKLEME/LİSTELEME */}
                <div className="xl:col-span-2 space-y-6">
                  
                  {!selectedBankId || !questionBanks.find(b => b.id === selectedBankId) ? (
                    <div className="bg-white border border-outline rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-3 min-h-[400px]">
                      <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center border border-outline text-[#059669]">
                        <BookOpen size={24} />
                      </div>
                      <h3 className="font-serif font-black text-lg text-primary">Soru Bankası Seçilmedi</h3>
                      <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed mx-auto font-medium">
                        Sol tarafta yer alan mevcut LGS soru bankalarından birini seçebilir veya hiyerarşik müfredata uygun yeni bir soru bankası tanımlayarak içerisindeki soruları yönetebilirsiniz.
                      </p>
                    </div>
                  ) : (() => {
                    const activeBank = questionBanks.find(b => b.id === selectedBankId)!;
                    const bankQuestions = questions.filter(q => 
                      q.subject === activeBank.subject && 
                      q.unit === activeBank.unit && 
                      q.topic === activeBank.topic
                    );

                    return (
                      <div className="space-y-6">
                        
                        {/* Selected Question Bank Header Banner Card */}
                        <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-outline pb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded">
                                  LGS SORU BANKASI AKTİF GÖRÜNÜM
                                </span>
                                <span className="text-[10px] font-bold text-[#059669] bg-emerald-50 border border-emerald-100 px-2 py-0.2 rounded-full">
                                  {bankQuestions.length} Soru Bulunmaktadır
                                </span>
                              </div>
                              <h2 className="text-lg font-serif font-black text-primary leading-tight">
                                {activeBank.subject} &gt; {activeBank.unit}
                              </h2>
                              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                                <strong>Kazanım Alt Konusu:</strong> {activeBank.topic}
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                if (showQuestionForm) {
                                  setShowQuestionForm(false);
                                  resetQuestionForm();
                                } else {
                                  resetQuestionForm();
                                  setShowQuestionForm(true);
                                }
                              }}
                              className="px-4 py-2.5 bg-primary hover:bg-neutral-800 text-white uppercase text-[10px] font-black tracking-widest rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                            >
                              {showQuestionForm ? 'Formu Kapat' : '⁺ Bu Bankaya Soru Ekle'}
                            </button>
                          </div>

                          {/* Show Form if enabled */}
                          {showQuestionForm && (
                            <div className="bg-surface-dim/40 border border-outline rounded-2xl p-5 space-y-4 text-xs font-semibold">
                              <h3 className="text-xs font-serif font-black pb-2 border-b border-outline flex justify-between items-center text-primary">
                                <span>{editingQuestionId ? `Soruyu Düzenle (ID: ${editingQuestionId})` : 'Bu Soru Bankasına Soru Ekliyorsunuz'}</span>
                                <span className="text-[10px] font-mono text-[#059669] uppercase font-bold">Hiyerarşi Otomatik Kilitlendi ✔</span>
                              </h3>

                              {/* Invisible preset fields message */}
                              <div className="p-3 bg-slate-50 border border-slate-150 text-slate-800 rounded-xl leading-relaxed text-[11px] font-medium flex gap-2">
                                <span className="font-mono text-slate-600 bg-neutral-200 p-0.5 px-1.5 rounded text-[9px] uppercase font-bold tracking-wider h-max shrink-0">KİLİTLİ</span>
                                <div>
                                  Bu soru otomatik olarak <strong>{activeBank.subject}</strong> dersi, <strong>{activeBank.unit}</strong> ünitesi ve <strong>{activeBank.topic}</strong> alt konusu kazanımı altına kaydedilecektir. Müfredat hiyerarşisi Soru Bankası üzerinden otomatik senkronize edilmiştir.
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-primary block">Soru Zorluğu</label>
                                  <select
                                    value={qDifficulty}
                                    onChange={(e) => setQDifficulty(e.target.value as Difficulty)}
                                    className="w-full bg-white border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-bold"
                                  >
                                    <option value="Kolay">Kolay Seviye</option>
                                    <option value="Orta">Orta Seviye</option>
                                    <option value="Zor">Zor Seviye (Derece)</option>
                                  </select>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-primary block">Sık Yapılan Hata Türü</label>
                                  <input
                                    type="text"
                                    placeholder="Örn: Kural Karışıklığı, İşlem Hatası, Grafik Okuma"
                                    value={qErrorType}
                                    onChange={(e) => setQErrorType(e.target.value)}
                                    className="w-full bg-white border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-bold"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-primary block">Sorunun Başlangıç Bağlamı (Bağlam Alıntı / Tırnaklı İfade)</label>
                                <input
                                  type="text"
                                  placeholder="Örn: 'Bir kenarı a birim olan kübün hacmi...'"
                                  value={qContext}
                                  onChange={(e) => setQContext(e.target.value)}
                                  className="w-full bg-white border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-medium"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-primary block">Soru Ana Metni (Soru Senaryosu / Gelişmiş Hikaye)</label>
                                <textarea
                                  rows={3}
                                  placeholder="Sorunun senaryosunu, sayısal veya sözel hikayesini girin..."
                                  value={qText}
                                  onChange={(e) => setQText(e.target.value)}
                                  className="w-full bg-white border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-medium resize-none leading-relaxed"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-primary block">Soru Soru Kökü (Soru Sorusu - 'Buna göre bu kartların toplamı kaç olur?')</label>
                                <input
                                  type="text"
                                  placeholder="Soruda neyin istendiğini belirten net query kökünü girin..."
                                  value={qQuery}
                                  onChange={(e) => setQQuery(e.target.value)}
                                  className="w-full bg-white border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-medium"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-primary block">Şıklar & Seçenekler</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2 bg-white border border-outline p-2 rounded-xl">
                                    <span className="w-6 h-6 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold font-mono text-xs shrink-0">A</span>
                                    <input
                                      type="text"
                                      placeholder="A Seçeneği"
                                      value={optA}
                                      onChange={(e) => setOptA(e.target.value)}
                                      className="flex-1 bg-transparent p-1 px-2.5 outline-none border-none text-primary font-bold focus:ring-0 text-xs"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 bg-white border border-outline p-2 rounded-xl">
                                    <span className="w-6 h-6 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold font-mono text-xs shrink-0">B</span>
                                    <input
                                      type="text"
                                      placeholder="B Seçeneği"
                                      value={optB}
                                      onChange={(e) => setOptB(e.target.value)}
                                      className="flex-1 bg-transparent p-1 px-2.5 outline-none border-none text-primary font-bold focus:ring-0 text-xs"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 bg-white border border-outline p-2 rounded-xl">
                                    <span className="w-6 h-6 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold font-mono text-xs shrink-0">C</span>
                                    <input
                                      type="text"
                                      placeholder="C Seçeneği"
                                      value={optC}
                                      onChange={(e) => setOptC(e.target.value)}
                                      className="flex-1 bg-transparent p-1 px-2.5 outline-none border-none text-primary font-bold focus:ring-0 text-xs"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 bg-white border border-outline p-2 rounded-xl">
                                    <span className="w-6 h-6 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold font-mono text-xs shrink-0">D</span>
                                    <input
                                      type="text"
                                      placeholder="D Seçeneği"
                                      value={optD}
                                      onChange={(e) => setOptD(e.target.value)}
                                      className="flex-1 bg-transparent p-1 px-2.5 outline-none border-none text-primary font-bold focus:ring-0 text-xs"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-primary block">Doğru Şık Hangisi?</label>
                                  <select
                                    value={correctOption}
                                    onChange={(e) => setCorrectOption(e.target.value as 'A' | 'B' | 'C' | 'D')}
                                    className="w-full bg-white border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-emerald-700 font-bold"
                                  >
                                    <option value="A">A şıkkı doğru cevap</option>
                                    <option value="B">B şıkkı doğru cevap</option>
                                    <option value="C">C şıkkı doğru cevap</option>
                                    <option value="D">D şıkkı doğru cevap</option>
                                  </select>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-primary block">Süreç İpucu (Socrates Hint / Geri Bildirim)</label>
                                  <input
                                    type="text"
                                    placeholder="Örn: Sorudaki katsayıyı parçalamak iyi bir başlangıç olabilir..."
                                    value={qHint}
                                    onChange={(e) => setQHint(e.target.value)}
                                    className="w-full bg-white border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-medium"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-primary block flex items-center gap-1">
                                  <span>Görsel İpucu URL (Grafikler, Geometrik Şekiller vb.)</span>
                                  <span className="font-normal italic text-on-surface-variant/70 text-[10px]">(İsteğe bağlı)</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="Örn: https://images.unsplash.com/... veya lokal görsel yolu"
                                  value={qImageUrl}
                                  onChange={(e) => setQImageUrl(e.target.value)}
                                  className="w-full bg-white border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-medium"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-primary block">Öğrenci Hatalı Cevap Verdiğinde Sunulacak Çözüm Analizi</label>
                                <textarea
                                  rows={2}
                                  placeholder="Öğrenci bu sık yapılan hataya düştüğünde Sokrates mentoru asistanı tarafından fısıldanacak açıklayıcı ve yapıcı analiz..."
                                  value={qErrorAnalysis}
                                  onChange={(e) => setQErrorAnalysis(e.target.value)}
                                  className="w-full bg-white border border-outline rounded-xl p-3 focus:outline-none focus:border-primary text-primary font-medium resize-none leading-relaxed"
                                />
                              </div>

                              <div className="flex justify-end gap-2 pt-2 border-t border-outline">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowQuestionForm(false);
                                    resetQuestionForm();
                                  }}
                                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-primary uppercase font-bold text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
                                >
                                  VAZGEÇ / TEMİZLE
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveQuestion}
                                  className="px-5 py-2.5 bg-[#059669] hover:bg-emerald-700 text-white uppercase font-bold text-[10px] tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Save size={14} />
                                  <span>{editingQuestionId ? 'Değişiklikleri Kaydet' : 'Soruyu Soru Bankasına Ekle'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* List of questions in active bank */}
                        <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-4">
                          <h3 className="font-serif font-black text-lg text-primary border-b border-light-outline pb-2">
                            Bankadaki Sorular ({bankQuestions.length} Soru)
                          </h3>

                          <div className="space-y-3">
                            {bankQuestions.map((q) => {
                              const isCorrectOptionLabel = q.options.find(o => o.isCorrect)?.label;
                              return (
                                <div
                                  key={q.id}
                                  className={`p-4 border rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-4 transition-all hover:bg-neutral-50/25 ${
                                    currentQuestion && currentQuestion.id === q.id 
                                      ? 'border-primary bg-primary/[0.01] shadow-sm' 
                                      : 'border-outline bg-white'
                                  }`}
                                >
                                  <div className="space-y-1.5 flex-1 min-w-0 text-left">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="bg-neutral-100 border border-neutral-200 text-neutral-800 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                                        Soru #{q.id}
                                      </span>
                                      {q.imageUrl && (
                                        <span className="bg-sky-50 border border-sky-150 text-sky-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1" title="Görsel İpucu Mevcut">
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

                                    <p className="text-xs text-primary font-bold font-serif whitespace-pre-wrap leading-relaxed line-clamp-3">
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
                                        addLog('info', 'SELECT_QUESTION', `Aktif önizleme sorusu "${q.id}" olarak değiştirildi.`);
                                      }}
                                      title="Öğrenci Ekranında Önizle"
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 p-2 py-1.5 rounded-lg transition-all text-[11px] font-bold cursor-pointer"
                                    >
                                      Önizle
                                    </button>
                                    <button
                                      onClick={() => {
                                        selectQuestionForEdit(q);
                                        setShowQuestionForm(true);
                                      }}
                                      title="Düzenle"
                                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 p-2 py-1.5 rounded-lg transition-all text-[11px] font-bold cursor-pointer"
                                    >
                                      Düzenle
                                    </button>
                                    <button
                                      onClick={() => handleDeleteQuestion(q.id)}
                                      title="Kalıcı Olarak Sil"
                                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 p-2 py-1.5 rounded-lg transition-all text-[11px] font-bold cursor-pointer"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>

                                </div>
                              );
                            })}

                            {bankQuestions.length === 0 && (
                              <div className="p-12 text-center border border-dashed border-outline bg-neutral-50/20 rounded-2xl space-y-2">
                                <Plus size={20} className="text-[#059669] mx-auto opacity-70" />
                                <h4 className="text-xs font-serif font-black text-primary">Soru Bankası Henüz Boş</h4>
                                <p className="text-[11px] text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                                  Hemen sağ üstte yer alan <strong>"Bu Bankaya Soru Ekle"</strong> butonuna tıklayarak ilk özgün LGS sorusunu tanımlayabilirsiniz.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })()}

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
                          triggerConfirm(
                            'İstatistikleri Sıfırla',
                            'Tüm soru çözme istatistiklerini temizlemek istediğinizden emin misiniz?',
                            () => {
                              setSolveHistory([]);
                              addLog('warn', 'SIMULATION', 'Tüm soru çözme istatistikleri sıfırlandı.');
                            }
                          );
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

          {/* 9. MANUAL CURRICULUM FILTERS COORD PANEL (HIERARCHICAL DESIGN) */}
          {adminTab === 'mufredat' && (
            <div className="space-y-6">
              {/* Header Info Block with Publish Action */}
              <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-light-outline">
                  <div className="flex items-center gap-2">
                    <LayoutGrid size={18} className="text-[#059669]" />
                    <h2 className="text-lg font-serif font-black text-primary">Hiyerarşik Müfredat (Ders, Ünite, Alt Konu) Yönetimi</h2>
                  </div>
                  
                  {/* Sitede Yayınla & Güncelle Action Button */}
                  <button
                    onClick={handlePublishSyllabus}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black uppercase text-[10px] sm:text-[11px] tracking-wider px-5 py-2.5 rounded-2xl shadow-lg shadow-emerald-600/10 transition-all cursor-pointer"
                  >
                    <RefreshCw size={14} className="animate-spin-slow text-white" />
                    Sitede Yayınla & Güncelle
                  </button>
                </div>
                
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  LGS Hazırlık müfredatınızı sırasıyla <strong>Dersler</strong>, bu derslere ait <strong>Üniteler</strong> ve ünitelerin altındaki <strong>Alt Konular (Kazanımlar)</strong> hiyerarşisine uygun olarak tamamen bağımsız yönetebilirsiniz. Bu yapıda yaptığınız her ekleme, çıkarma ve sıralama değişikliğinin sitede aktif olması için <strong>"Sitede Yayınla & Güncelle"</strong> butonuna basmanız yeterlidir.
                </p>
              </div>
 
              {/* Four-Column Interactive Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 
                {/* 1. DERS EKLEME & SİLME */}
                <div className="bg-white border border-outline rounded-3xl p-5 shadow-sm flex flex-col space-y-4">
                  <div className="pb-2 border-b border-outline">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#059669] flex items-center justify-between">
                      <span>1. Ders Listesi</span>
                      <span className="text-[10px] bg-emerald-50 text-[#059669] px-2 py-0.5 rounded-full font-mono font-bold">
                        {Array.from(new Set(syllabus.map(s => s.subject).filter(Boolean))).length} Ders
                      </span>
                    </h3>
                  </div>
 
                  {/* Add Course Form */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-primary font-bold block uppercase tracking-wider">Yeni Ders Ekle</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Örn: İngilizce, Din Kültürü"
                        value={newDersInput}
                        onChange={(e) => setNewDersInput(e.target.value)}
                        className="flex-1 bg-surface-dim border border-outline rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#059669] text-primary font-bold"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddDers(newDersInput);
                            setNewDersInput('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          handleAddDers(newDersInput);
                          setNewDersInput('');
                        }}
                        className="px-3 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
                        title="Ders Ekle"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
 
                  {/* Course List Scrollable */}
                  <div className="flex-1 overflow-y-auto max-h-80 border border-outline rounded-xl divide-y divide-outline bg-surface-bright">
                    {(Array.from(new Set(syllabus.map(s => s.subject).filter(Boolean))) as string[]).map((ders, index, arr) => {
                      const isActive = selectedMufredatDers === ders;
                      return (
                        <div
                          key={ders}
                          onClick={() => {
                            setSelectedMufredatDers(ders);
                            setSelectedMufredatUnite('');
                            setSelectedMufredatTopic('');
                          }}
                          className={`p-3 flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs font-bold ${
                            isActive ? 'bg-[#059669]/10 text-[#059669] border-l-4 border-l-[#059669]' : 'text-primary hover:bg-neutral-50'
                          }`}
                        >
                          <span className="truncate flex-1">{ders}</span>
                          
                          {/* Reordering and deleting buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveDers(ders, 'up');
                              }}
                              disabled={index === 0}
                              className={`p-1 hover:bg-neutral-100 rounded transition-colors ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'text-primary'}`}
                              title="Yukarı Taşı"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveDers(ders, 'down');
                              }}
                              disabled={index === arr.length - 1}
                              className={`p-1 hover:bg-neutral-100 rounded transition-colors ${index === arr.length - 1 ? 'opacity-30 cursor-not-allowed' : 'text-primary'}`}
                              title="Aşağı Taşı"
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDers(ders);
                              }}
                              className="p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Dersi Sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {Array.from(new Set(syllabus.map(s => s.subject).filter(Boolean))).length === 0 && (
                      <div className="p-4 text-center text-[11px] text-on-surface-variant font-medium">Tebrikler, henüz hiç ders eklenmemiş.</div>
                    )}
                  </div>
                </div>

                {/* 2. DERSE GÖRE ÜNİTE EKLEME & SİLME */}
                <div className="bg-white border border-outline rounded-3xl p-5 shadow-sm flex flex-col space-y-4">
                  <div className="pb-2 border-b border-outline">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#059669] flex items-center justify-between">
                      <span>2. Üniteler</span>
                      {selectedMufredatDers && (
                        <span className="text-[10px] bg-emerald-50 text-[#059669] px-2 py-0.5 rounded-full font-mono font-bold">
                          {Array.from(new Set(syllabus.filter(s => s.subject === selectedMufredatDers).map(s => s.unit).filter(Boolean))).length} Ünite
                        </span>
                      )}
                    </h3>
                  </div>

                  {!selectedMufredatDers ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-outline rounded-xl bg-neutral-50/50 space-y-1">
                      <LayoutGrid size={18} className="text-on-surface-variant/50" />
                      <p className="text-[11px] text-on-surface-variant font-bold leading-normal">Lütfen soldan bir Ders seçin.</p>
                      <p className="text-[9px] text-on-surface-variant/75">Seçtiğiniz derse ait üniteleri yönetebilirsiniz.</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col space-y-4">
                      {/* Add Unit Form */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-primary font-bold block uppercase tracking-wider">
                          "{selectedMufredatDers}" Dersine Ünite Ekle
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Örn: Friendship, DNA ve Genetik"
                            value={newUniteInput}
                            onChange={(e) => setNewUniteInput(e.target.value)}
                            className="flex-1 bg-surface-dim border border-outline rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#059669] text-primary font-bold"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddUnite(selectedMufredatDers, newUniteInput);
                                setNewUniteInput('');
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              handleAddUnite(selectedMufredatDers, newUniteInput);
                              setNewUniteInput('');
                            }}
                            className="px-3 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
                            title="Ünite Ekle"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Unit Scrollable List */}
                      <div className="flex-1 overflow-y-auto max-h-64 border border-outline rounded-xl divide-y divide-outline bg-surface-bright">
                        {(Array.from(new Set(syllabus.filter(s => s.subject === selectedMufredatDers).map(s => s.unit).filter(Boolean))) as string[]).map((unite, index, arr) => {
                          const isActive = selectedMufredatUnite === unite;
                          return (
                            <div
                              key={unite}
                              onClick={() => {
                                setSelectedMufredatUnite(unite);
                                setSelectedMufredatTopic('');
                              }}
                              className={`p-3 flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs font-bold ${
                                isActive ? 'bg-[#059669]/10 text-[#059669] border-l-4 border-l-[#059669]' : 'text-primary hover:bg-neutral-50'
                              }`}
                            >
                              <span className="truncate flex-1">{unite}</span>
                              
                              {/* Reordering and deleting buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveUnite(selectedMufredatDers, unite, 'up');
                                  }}
                                  disabled={index === 0}
                                  className={`p-1 hover:bg-neutral-100 rounded transition-colors ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'text-primary'}`}
                                  title="Yukarı Taşı"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveUnite(selectedMufredatDers, unite, 'down');
                                  }}
                                  disabled={index === arr.length - 1}
                                  className={`p-1 hover:bg-neutral-100 rounded transition-colors ${index === arr.length - 1 ? 'opacity-30 cursor-not-allowed' : 'text-primary'}`}
                                  title="Aşağı Taşı"
                                >
                                  <ChevronDown size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveUnite(selectedMufredatDers, unite);
                                  }}
                                  className="p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                                  title="Üniteyi Sil"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {Array.from(new Set(syllabus.filter(s => s.subject === selectedMufredatDers).map(s => s.unit).filter(Boolean))).length === 0 && (
                          <div className="p-4 text-center text-[10px] text-on-surface-variant font-semibold">Bu derse ait henüz bir ünite tanımlanmamış.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. ÜNİTEYE GÖRE ALT KONU EKLEME & SİLME */}
                <div className="bg-white border border-outline rounded-3xl p-5 shadow-sm flex flex-col space-y-4">
                  <div className="pb-2 border-b border-outline">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#059669] flex items-center justify-between">
                      <span>3. Alt Konular</span>
                      {selectedMufredatDers && selectedMufredatUnite && (
                        <span className="text-[10px] bg-emerald-50 text-[#059669] px-2 py-0.5 rounded-full font-mono font-bold">
                          {Array.from(new Set(syllabus.filter(s => s.subject === selectedMufredatDers && s.unit === selectedMufredatUnite).map(s => s.topic).filter(Boolean))).length} Konu
                        </span>
                      )}
                    </h3>
                  </div>

                  {(!selectedMufredatDers || !selectedMufredatUnite) ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-outline rounded-xl bg-neutral-50/50 space-y-1">
                      <LayoutGrid size={18} className="text-on-surface-variant/50" />
                      <p className="text-[11px] text-on-surface-variant font-bold leading-normal">Lütfen soldan Ders ve Ünite seçin.</p>
                      <p className="text-[9px] text-on-surface-variant/75">Grup altındaki alt konu kazanımlarını silebilir veya ekleyebilirsiniz.</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col space-y-4">
                      {/* Add Topic Form */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-primary font-bold block uppercase tracking-wider">
                          "{selectedMufredatUnite}" Ünitesine Alt Konu Ekle
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Örn: Accept and refuse invitations"
                            value={newTopicInput}
                            onChange={(e) => setNewTopicInput(e.target.value)}
                            className="flex-1 bg-surface-dim border border-outline rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#059669] text-primary font-bold"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddTopic(selectedMufredatDers, selectedMufredatUnite, newTopicInput);
                                setNewTopicInput('');
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              handleAddTopic(selectedMufredatDers, selectedMufredatUnite, newTopicInput);
                              setNewTopicInput('');
                            }}
                            className="px-3 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
                            title="Alt Konu Ekle"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Topic Scrollable List */}
                      <div className="flex-1 overflow-y-auto max-h-64 border border-outline rounded-xl divide-y divide-outline bg-surface-bright">
                        {(Array.from(new Set(syllabus.filter(s => s.subject === selectedMufredatDers && s.unit === selectedMufredatUnite).map(s => s.topic).filter(Boolean))) as string[]).map((topic, index, arr) => {
                          const isTopicActive = selectedMufredatTopic === topic;
                          return (
                            <div
                              key={topic}
                              onClick={() => setSelectedMufredatTopic(topic)}
                              className={`p-3 flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs font-bold ${
                                isTopicActive ? 'bg-[#059669]/10 text-[#059669] border-l-4 border-l-[#059669]' : 'text-primary hover:bg-neutral-50 bg-neutral-50/20'
                              }`}
                            >
                              <span className="truncate flex-1 leading-relaxed font-semibold">{topic}</span>
                              
                              {/* Reordering and deleting buttons for Topic */}
                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleMoveTopic(selectedMufredatDers, selectedMufredatUnite, topic, 'up')}
                                  disabled={index === 0}
                                  className={`p-1 hover:bg-neutral-100 rounded transition-colors ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'text-primary'}`}
                                  title="Yukarı Taşı"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  onClick={() => handleMoveTopic(selectedMufredatDers, selectedMufredatUnite, topic, 'down')}
                                  disabled={index === arr.length - 1}
                                  className={`p-1 hover:bg-neutral-100 rounded transition-colors ${index === arr.length - 1 ? 'opacity-30 cursor-not-allowed' : 'text-primary'}`}
                                  title="Aşağı Taşı"
                                >
                                  <ChevronDown size={14} />
                                </button>
                                <button
                                  onClick={() => handleRemoveTopic(selectedMufredatDers, selectedMufredatUnite, topic)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors cursor-pointer shrink-0"
                                  title="Alt Konuyu Sil"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {Array.from(new Set(syllabus.filter(s => s.subject === selectedMufredatDers && s.unit === selectedMufredatUnite).map(s => s.topic).filter(Boolean))).length === 0 && (
                          <div className="p-4 text-center text-[10px] text-on-surface-variant font-semibold">Bu üniteye ait henüz bir alt konu tanımlanmamış.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. SORU BANKALARI YÖNETİMİ */}
                <div className="bg-white border border-outline rounded-3xl p-5 shadow-sm flex flex-col space-y-4">
                  <div className="pb-2 border-b border-outline">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#059669] flex items-center justify-between">
                      <span>4. Soru Bankaları</span>
                      {selectedMufredatDers && selectedMufredatUnite && selectedMufredatTopic && (
                        <span className="text-[10px] bg-emerald-50 text-[#059669] px-2 py-0.5 rounded-full font-mono font-bold font-serif">
                          {questionBanks.filter(b => b.subject === selectedMufredatDers && b.unit === selectedMufredatUnite && b.topic === selectedMufredatTopic).length} Banka
                        </span>
                      )}
                    </h3>
                  </div>

                  {(!selectedMufredatDers || !selectedMufredatUnite || !selectedMufredatTopic) ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-outline rounded-xl bg-neutral-50/50 space-y-1">
                      <LayoutGrid size={18} className="text-on-surface-variant/50" />
                      <p className="text-[11px] text-on-surface-variant font-bold leading-normal">Lütfen soldan Alt Konu seçin.</p>
                      <p className="text-[9px] text-on-surface-variant/75">Seçtiğiniz kazanımın altındaki soru bankalarını yönetebilirsiniz.</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col space-y-4">
                      {/* Add bank form */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-primary font-bold block uppercase tracking-wider">
                          Soru Bankası Tanımla (İsim Ver)
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Zor Seviye 1. Soru Bankası"
                            value={newBankNameInput}
                            onChange={(e) => setNewBankNameInput(e.target.value)}
                            className="flex-1 bg-surface-dim border border-outline rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#059669] text-primary font-bold"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddHierarchicalBank(selectedMufredatDers, selectedMufredatUnite, selectedMufredatTopic, newBankNameInput);
                                setNewBankNameInput('');
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              handleAddHierarchicalBank(selectedMufredatDers, selectedMufredatUnite, selectedMufredatTopic, newBankNameInput);
                              setNewBankNameInput('');
                            }}
                            className="px-3 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
                            title="Soru Bankası Tanımla"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Question Banks List Scrollable */}
                      <div className="flex-1 overflow-y-auto max-h-64 border border-outline rounded-xl divide-y divide-outline bg-surface-bright">
                        {questionBanks
                          .filter(b => b.subject === selectedMufredatDers && b.unit === selectedMufredatUnite && b.topic === selectedMufredatTopic)
                          .map((bank) => {
                            const isEditing = editingBankId === bank.id;
                            const bankCount = questions.filter(q => 
                              q.subject === bank.subject && 
                              q.unit === bank.unit && 
                              q.topic === bank.topic
                            ).length;
                            const isSelected = selectedBankId === bank.id;

                            return (
                              <div
                                key={bank.id}
                                className={`p-3 flex flex-col gap-2 text-xs transition-all ${
                                  isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-neutral-50 bg-neutral-50/10'
                                }`}
                              >
                                {isEditing ? (
                                  <div className="flex items-center gap-1.5 w-full">
                                    <input
                                      type="text"
                                      value={editingBankNameVal}
                                      onChange={(e) => setEditingBankNameVal(e.target.value)}
                                      className="flex-1 bg-white border border-outline rounded-lg px-2 py-1 text-xs font-bold text-primary"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleEditBankName(bank.id, editingBankNameVal);
                                          setEditingBankId(null);
                                        } else if (e.key === 'Escape') {
                                          setEditingBankId(null);
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => {
                                        handleEditBankName(bank.id, editingBankNameVal);
                                        setEditingBankId(null);
                                      }}
                                      className="p-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                      title="Tamam"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button
                                      onClick={() => setEditingBankId(null)}
                                      className="p-1 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                                      title="Vazgeç"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1">
                                      <h4 className="font-serif font-black text-primary leading-tight text-[11px]">{bank.name || 'İsimsiz Soru Bankası'}</h4>
                                      <div className="flex items-center gap-2 text-[9px] text-on-surface-variant/80 font-medium">
                                        <span>{bankCount} Soru</span>
                                        <span>•</span>
                                        <span>Eklendi: {bank.createdAt || 'Varsayılan'}</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => {
                                          setEditingBankId(bank.id);
                                          setEditingBankNameVal(bank.name || '');
                                        }}
                                        className="p-1 text-[#059669] hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                                        title="Soru Bankası İsmini Düzenle"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm('Bu soru bankasını silmek istediğinize emin misiniz? Soru bankasının kendisi silinecektir.')) {
                                            const updated = questionBanks.filter(b => b.id !== bank.id);
                                            saveQuestionBanks(updated);
                                            if (selectedBankId === bank.id) {
                                              localStorage.removeItem('lgs_selected_bank_id');
                                              setSelectedBankId(null);
                                            }
                                            addLog('warn', 'QUESTION_BANK', `Soru bankası kaldırıldı: ${bank.name}`);
                                          }
                                        }}
                                        className="p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                                        title="Soru Bankasını Sil"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-outline/30" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-[9px] font-bold text-[#059669]/90 bg-emerald-50 px-1.5 py-0.5 rounded">Aktif Sınav Katmanı</span>
                                  {isSelected ? (
                                    <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                                      <Check size={12} />
                                      Seçili
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        localStorage.setItem('lgs_selected_bank_id', bank.id);
                                        setSelectedBankId(bank.id);
                                        addLog('success', 'QUESTION_BANK', `Soru bankası aktif seçildi: ${bank.name}`);
                                        // Reset current workspace question bank to 1st question!
                                        window.dispatchEvent(new Event('lgs_syllabus_updated'));
                                      }}
                                      className="text-[9px] uppercase font-black tracking-wider text-primary bg-surface-dim hover:bg-neutral-100 border border-outline px-2 py-1 rounded-lg cursor-pointer transition-all"
                                    >
                                      Sitede Aktif Et
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                        {questionBanks.filter(b => b.subject === selectedMufredatDers && b.unit === selectedMufredatUnite && b.topic === selectedMufredatTopic).length === 0 && (
                          <div className="p-4 text-center text-[10px] text-on-surface-variant font-semibold">Bu konuya ait henüz bir soru bankası tanımlanmamış.</div>
                        )}
                      </div>
                    </div>
                  )}
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

    <AnimatePresence>
      {modalConfig && modalConfig.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalConfig(null)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          {/* Modal Body */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md bg-white border border-outline rounded-3xl p-6 shadow-2xl space-y-5 text-left overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 shrink-0">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-serif font-black text-primary leading-snug">
                  {modalConfig.title}
                </h3>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed whitespace-pre-wrap">
                  {modalConfig.message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-light-outline">
              <button
                type="button"
                onClick={() => setModalConfig(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-primary font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
              >
                {modalConfig.cancelLabel || (modalConfig.type === 'confirm' ? 'Hayır' : 'Kapat')}
              </button>
              {modalConfig.type === 'confirm' && modalConfig.onConfirm && (
                <button
                  type="button"
                  onClick={modalConfig.onConfirm}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {modalConfig.confirmLabel || 'Evet'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
