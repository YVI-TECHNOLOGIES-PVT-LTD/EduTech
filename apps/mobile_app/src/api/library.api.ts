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

export const libraryApi = {
  /**
   * Fetch active issued books and library status for a student
   */
  async getStudentLibrary(studentId: string): Promise<StudentLibraryRecord | null> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.LIBRARY.ISSUED_BOOKS(studentId));
      return res?.data || res || null;
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
