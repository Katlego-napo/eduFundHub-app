export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type Quiz = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  questions: QuizQuestion[];
  created_by: string | null;
  created_at: string;
};

export const QUIZ_GRADES = [
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "TVET",
  "University",
] as const;