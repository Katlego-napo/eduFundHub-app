import type { Quiz, QuizQuestion } from "@/lib/types/quiz";

/**
 * Quiz questions (and their answers) are only sent to the browser for
 * subscribers and admins. Everyone else gets the quiz with every question
 * blanked out: the real count is kept so cards can say "10 questions", but
 * no question text, options, answers or explanations leave the server.
 */
const BLANK: QuizQuestion = {
  question: "",
  options: [],
  correctIndex: 0,
  explanation: "",
  diagram: null,
};

export function lockQuiz(quiz: Quiz): Quiz {
  return {
    ...quiz,
    questions: (quiz.questions ?? []).map(() => ({ ...BLANK })),
  };
}

export function prepareQuizzes(quizzes: Quiz[], canView: boolean): Quiz[] {
  return canView ? quizzes : quizzes.map(lockQuiz);
}
