export function buildLocalReport(
  fullName: string,
  subs: { name: string; score: number }[]
): string {
  if (subs.length === 0) return '';

  const overall = subs.reduce((s, r) => s + r.score, 0) / subs.length;
  const sorted = [...subs].sort((a, b) => b.score - a.score);

  const aboveAvg = sorted.filter(s => s.score >= overall);
  const belowAvg = sorted.filter(s => s.score < overall);

  const joinNames = (arr: { name: string }[]) =>
    arr.length === 1
      ? arr[0].name
      : arr.slice(0, -1).map(s => s.name).join(', ') + ' and ' + arr[arr.length - 1].name;

  let s1 = '';
  if (aboveAvg.length === subs.length) {
    s1 = `${fullName} is performing exceptionally well across all subjects, demonstrating a strong grasp of the curriculum with an overall average of ${overall.toFixed(1)}%.`;
  } else if (aboveAvg.length > 0) {
    const strengthDesc =
      overall >= 75 ? 'exceptionally well' :
      overall >= 60 ? 'very well' : 'satisfactorily';
    s1 = `${fullName} is performing ${strengthDesc} in ${joinNames(aboveAvg)}, demonstrating a strong grasp of these core areas.`;
  } else {
    s1 = `${fullName} shows the most progress in ${sorted[0].name} with ${sorted[0].score.toFixed(1)}%, though there is significant room for improvement across all subjects.`;
  }

  let s2 = '';
  if (belowAvg.length > 0) {
    const belowPass = belowAvg.filter(s => s.score < 40);
    if (belowPass.length > 0) {
      s2 = `However, ${fullName} has a challenge with ${joinNames(belowPass)}, where performance is currently below the minimum pass standard.`;
    } else {
      s2 = `However, ${fullName} has a challenge with ${joinNames(belowAvg)}, where performance is currently below their personal average.`;
    }
  }

  let s3 = '';
  const hasFailingSubjects = subs.some(s => s.score < 40);
  const hasBelowAvgSubjects = belowAvg.length > 0;
  if (hasFailingSubjects) {
    s3 = `We strongly recommend consistent practice, additional tutorial support, and closer monitoring in these subjects to ensure ${fullName} meets the required standard before the end of term.`;
  } else if (hasBelowAvgSubjects) {
    s3 = `We recommend consistent practice and additional tutorial support in these subjects to build confidence and improve results.`;
  } else {
    s3 = `We encourage ${fullName} to maintain this excellent standard and continue demonstrating consistent effort across all learning areas.`;
  }

  return [s1, s2, s3].filter(Boolean).join(' ');
}
