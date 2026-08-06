import { IndexableDocument } from '../contracts/search.contracts';

export class ScoreEngine {
  public static calculateRelevance(doc: IndexableDocument, query: string): number {
    const q = query.toLowerCase().trim();
    if (!q) return 1.0;

    let score = 0.0;
    const title = doc.title.toLowerCase();
    const content = doc.content.toLowerCase();

    // Exact title match bonus
    if (title === q) score += 10.0;
    else if (title.includes(q)) score += 5.0;

    // Content match
    if (content.includes(q)) score += 2.0;

    // Category / Tag match bonus
    if (doc.category?.toLowerCase().includes(q)) score += 3.0;
    if (doc.tags?.some((t) => t.toLowerCase().includes(q))) score += 4.0;

    return Math.round(score * 100) / 100;
  }
}
