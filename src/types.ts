export type Difficulty = 'Kolay' | 'Orta' | 'Zor' | 'Hepsi';

export interface Option {
  label: string;
  value: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  difficulty: Difficulty;
  text: string;
  context: string;
  query: string;
  options: Option[];
  hint: string;
  errorAnalysis: string;
  errorType: string;
  imageUrl?: string;
  subject: string;
  unit: string;
  topic: string;
}

export interface SolveHistory {
  questionId: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  difficulty: Difficulty;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  isHint?: boolean;
}

export interface ResourceFile {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'video';
  folder: 'Ders Notları' | 'Çıkmış Sorular' | 'Deneme Sınavları' | 'Video Çözümler';
  topic: string;
  content: string; // Summary math content or description notes
  duration?: string; // e.g. "12:45"
  videoUrl?: string;
  notes?: string;
}
