export type PastPaper = {
  id: string;
  subject: string;
  grade: string;
  year: string;
  paper_url: string;
  memo_url: string | null;
  download_count: number;
  created_at: string;
};

export const SUBJECTS = [
  "Mathematics",
  "Physical Sciences",
  "Accounting",
  "Business Studies",
  "Life Sciences",
] as const;

export const GRADE_LEVELS = [
  "Grade 12",
  "TVET Colleges",
  "Universities",
  "IT Courses",
] as const;
