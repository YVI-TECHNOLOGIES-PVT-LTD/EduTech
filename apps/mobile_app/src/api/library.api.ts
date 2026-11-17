import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  isOverdue: boolean;
  fineAmount: number;
}

export interface StudentLibraryRecord {
  studentId: string;
  cardNumber: string;
  status: 'active' | 'suspended' | 'not_registered';
  booksIssued: number;
  maxAllowed: number;
  activeBooks: LibraryBook[];
}

const libraryCache = new Map<string, { data: StudentLibraryRecord | null; cachedAt: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000;

export const libraryApi = {
  /**
   * Fetch active issued books and library status for a student (3m cached)
   */
  async getStudentLibrary(studentId: string, force = false): Promise<StudentLibraryRecord | null> {
    if (!studentId) return null;

    const cached = libraryCache.get(studentId);
    if (!force && cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const res = await apiClient.get<any>(ENDPOINTS.LIBRARY.ISSUED_BOOKS(studentId));
      const data = res?.data || res || null;
      libraryCache.set(studentId, { data, cachedAt: Date.now() });
      return data;
    } catch {
      // Graceful fallback
    }
    return null;
  },

  /**
   * Fetch historical borrowed books
   */
  async getBorrowingHistory(studentId: string): Promise<LibraryBook[]> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.LIBRARY.BORROWING_HISTORY(studentId));
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res)) return res;
    } catch {
      // Graceful fallback
    }
    return [];
  },
};
