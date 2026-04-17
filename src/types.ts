export type Difficulty = 'easy' | 'medium' | 'hard';
export type BloomLevel = 'remembering' | 'understanding' | 'applying' | 'analyzing' | 'evaluating' | 'creating';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex?: number;
  difficulty?: Difficulty;
  bloomLevel?: BloomLevel;
}

export interface Exam {
  id?: string;
  userId: string;
  title: string;
  subject?: string;
  questions: Question[];
  psychometrics?: Record<string, { total: number; correct: number; correctHigh: number; correctLow: number }>;
  hasGenerated?: boolean;
  createdAt: any;
  updatedAt?: any;
}

export interface GeneratedModel {
  id?: string;
  examId: string;
  userId: string;
  version: 'A' | 'B' | 'C';
  questions: Question[];
  answerKey: Record<string, number>;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}
