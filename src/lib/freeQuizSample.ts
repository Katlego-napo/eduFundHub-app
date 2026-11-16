const KEY = "edufundhub_free_quiz_sample_used";

export function hasUsedFreeQuizSample(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "true";
}

export function markFreeQuizSampleUsed() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, "true");
}