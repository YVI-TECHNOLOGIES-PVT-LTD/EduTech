export interface IndexSchemaDefinition {
  name: string;
  searchableFields: string[];
  sortableFields: string[];
  facetableFields: string[];
}

export class IndexRegistry {
  private static indexes = new Map<string, IndexSchemaDefinition>([
    [
      'students',
      {
        name: 'students',
        searchableFields: ['title', 'content', 'category'],
        sortableFields: ['createdAt', 'title'],
        facetableFields: ['category', 'status'],
      },
    ],
    [
      'courses',
      {
        name: 'courses',
        searchableFields: ['title', 'content', 'tags'],
        sortableFields: ['createdAt', 'title'],
        facetableFields: ['category', 'status'],
      },
    ],
  ]);

  public static register(schema: IndexSchemaDefinition): void {
    this.indexes.set(schema.name, schema);
  }

  public static get(name: string): IndexSchemaDefinition | undefined {
    return this.indexes.get(name);
  }

  public static list(): string[] {
    return Array.from(this.indexes.keys());
  }
}
