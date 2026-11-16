export function calculateAIScore(leadData: any): number {
  let score = 50;
  if (leadData.email && leadData.phone) score += 20;
  if (leadData.gradeApplyingFor || leadData.grade_applying_for) score += 15;
  if (leadData.source === 'Website Inquiry') score += 10;
  return Math.min(score, 100);
}
