export type GradeBand = { minimumScore: number; maximumScore: number; grade: string; point: number | null; remark: string | null };

export function calculateSubjectResult(scores: ReadonlyArray<number>, maximumScores: ReadonlyArray<number>, scale: ReadonlyArray<GradeBand>) {
  if (scores.length !== maximumScores.length || scores.some((value, index) => !Number.isFinite(value) || value < 0 || !Number.isFinite(maximumScores[index]) || maximumScores[index] <= 0 || value > maximumScores[index])) throw new Error("Scores must have matching positive maxima and stay within range.");
  const score = scores.reduce((total, value) => total + value, 0);
  const maximum = maximumScores.reduce((total, value) => total + value, 0);
  const percentage = maximum === 0 ? 0 : (score / maximum) * 100;
  // Whole-number grade bands include fractional marks up to the next boundary.
  const grade = maximum === 0 ? null : scale.find((item) => Math.floor(percentage) >= item.minimumScore && Math.floor(percentage) <= item.maximumScore) ?? null;
  return { score, maximum, percentage, grade: grade?.grade ?? null, point: grade?.point ?? null, remark: grade?.remark ?? null };
}
