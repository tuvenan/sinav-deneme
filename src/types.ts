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
