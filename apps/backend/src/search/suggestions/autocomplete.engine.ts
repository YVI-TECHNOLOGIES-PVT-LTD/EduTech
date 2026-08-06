import { IndexableDocument } from '../contracts/search.contracts';

export class AutocompleteEngine {
  public static generateSuggestions(docs: IndexableDocument[], query: string): string[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const suggestions = new Set<string>();
    for (const doc of docs) {
      if (doc.title.toLowerCase().startsWith(q)) {
        suggestions.add(doc.title);
      }
      if (doc.tags) {
        doc.tags.forEach((tag) => {
          if (tag.toLowerCase().startsWith(q)) suggestions.add(tag);
        });
      }
    }

    return Array.from(suggestions).slice(0, 5);
  }
}
