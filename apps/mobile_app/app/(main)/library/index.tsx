import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useChildStore } from '../../../src/stores/child.store';
import { SelectedChildCard } from '../../../src/components/child/SelectedChildCard';
import { Badge } from '../../../src/components/ui/atoms/Badge';
import { libraryApi, StudentLibraryRecord } from '../../../src/api/library.api';

export default function LibraryScreen() {
  const router = useRouter();
  const activeChild = useChildStore((s) => s.getSelectedChild());
  const isEnrolled = activeChild?.kind === 'enrolled';
  const studentId = isEnrolled ? activeChild.studentId : null;

  const [libraryData, setLibraryData] = useState<StudentLibraryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLibrary = async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const data = await libraryApi.getStudentLibrary(studentId);
      setLibraryData(data);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, [studentId]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchLibrary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center mb-4 pt-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 items-center justify-center mr-3 shadow-sm"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#334155" />
          </TouchableOpacity>
          <View>
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Learning Resources
            </Text>
            <Text className="text-xl font-black text-slate-900 dark:text-slate-100">
              Campus Library
            </Text>
          </View>
        </View>

        <SelectedChildCard />

        {!isEnrolled ? (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 items-center text-center shadow-sm mt-2">
            <View className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950 items-center justify-center mb-3">
              <Ionicons name="book-outline" size={28} color="#d97706" />
            </View>
            <Text className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Library Records Notice
            </Text>
            <Text className="text-xs text-slate-500 max-w-xs text-center leading-relaxed">
              Library cards and borrowing records are issued to enrolled students upon campus
              registration.
            </Text>
          </View>
        ) : (
          <>
            {/* Library Card Summary */}
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Student Library Card
                </Text>
                <Badge
                  label={libraryData?.status === 'active' ? 'Active Account' : 'Standard'}
                  variant="success"
                />
              </View>

              <Text className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1">
                {libraryData?.cardNumber || `LIB-${activeChild.admissionNumber}`}
              </Text>

              <View className="flex-row items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
                <View>
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">
                    Books Borrowed
                  </Text>
                  <Text className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {libraryData?.booksIssued || libraryData?.activeBooks?.length || 0} /{' '}
                    {libraryData?.maxAllowed || 3}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">
                    Overdue Dues
                  </Text>
                  <Text className="text-sm font-black text-slate-800 dark:text-slate-200">
                    ₹0.00
                  </Text>
                </View>
              </View>
            </View>

            {/* Issued Books List */}
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Currently Issued Books
            </Text>

            {libraryData?.activeBooks && libraryData.activeBooks.length > 0 ? (
              libraryData.activeBooks.map((book) => (
                <View
                  key={book.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Badge
                      label={book.isOverdue ? 'Overdue' : 'Issued'}
                      variant={book.isOverdue ? 'error' : 'primary'}
                    />
                    <Text className="text-xs text-slate-400">Issued: {book.issueDate}</Text>
                  </View>
                  <Text className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                    {book.title}
                  </Text>
                  <Text className="text-xs text-slate-500 mb-2">Author: {book.author}</Text>
                  <View className="flex-row items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Text className="text-[11px] text-slate-400">
                      Due:{' '}
                      <Text className="font-bold text-slate-700 dark:text-slate-300">
                        {book.dueDate}
                      </Text>
                    </Text>
                    {book.isOverdue && book.fineAmount > 0 && (
                      <Text className="text-[11px] font-bold text-rose-600">
                        Fine: ₹{book.fineAmount}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 items-center">
                <Ionicons name="book-outline" size={32} color="#94a3b8" />
                <Text className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2 text-center">
                  No books currently issued from the library.
                </Text>
                <Text className="text-[11px] text-slate-400 text-center mt-1">
                  Students may borrow up to 3 titles concurrently from the campus reading hall.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
