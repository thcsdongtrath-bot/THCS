
export enum Difficulty {
  RECALL = 'Nhận biết',
  COMPREHENSION = 'Thông hiểu',
  APPLICATION = 'Vận dụng',
  HIGH_APPLICATION = 'Vận dụng cao'
}

export enum QuestionType {
  PHONETICS = 'Ngữ âm',
  STRESS = 'Trọng âm',
  VOCABULARY = 'Từ vựng',
  GRAMMAR = 'Ngữ pháp',
  ERROR_CORRECTION = 'Tìm lỗi sai',
  COMMUNICATION = 'Giao tiếp',
  SYNONYM = 'Đồng nghĩa',
  ANTONYM = 'Trái nghĩa',
  READING = 'Đọc hiểu',
  CLOZE = 'Điền từ'
}

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  content: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  passage?: string; // For reading/cloze
}

export interface Test {
  id: string;
  title: string;
  grade: number;
  topic: string;
  duration: number; // minutes
  questions: Question[];
  createdAt: string;
  assignedClass: string;
}

export interface Submission {
  id: string;
  testId: string;
  studentName: string;
  studentId: string;
  answers: Record<string, string>;
  score: number;
  completedAt: string;
  aiFeedback?: string;
}

export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  classCode?: string;
}
