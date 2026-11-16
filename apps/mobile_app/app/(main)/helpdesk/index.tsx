import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHelpdeskStore } from '../../../src/stores/helpdesk.store';
import { Badge } from '../../../src/components/ui/atoms/Badge';
import { TicketCategory, TicketPriority, HelpdeskTicket } from '../../../src/api/helpdesk.api';

export default function HelpdeskHubScreen() {
  const router = useRouter();
  const {
    tickets,
    activeTicket,
    activeReplies,
    filter,
    isLoading,
    isSubmitting,
    setFilter,
    fetchTickets,
    fetchTicketDetails,
    createTicket,
    sendReply,
  } = useHelpdeskStore();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [ticketDetailsVisible, setTicketDetailsVisible] = useState(false);

  // Form State
  const [category, setCategory] = useState<TicketCategory>('general');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleOpenTicket = async (ticket: HelpdeskTicket) => {
    await fetchTicketDetails(ticket.id);
    setTicketDetailsVisible(true);
  };

  const handleCreateSubmit = async () => {
    if (!subject.trim() || !description.trim()) return;

    const success = await createTicket({
      category,
      priority,
      subject: subject.trim(),
      description: description.trim(),
    });

    if (success) {
      setSubject('');
      setDescription('');
      setCreateModalVisible(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeTicket || !replyText.trim()) return;

    const success = await sendReply(activeTicket.id, replyText);
    if (success) {
      setReplyText('');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchTickets} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View className="flex-row items-center justify-between mb-4 pt-1">
          <View className="flex-row items-center flex-1 mr-2">
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
                Support Service
              </Text>
              <Text className="text-xl font-black text-slate-900 dark:text-slate-100">
                Parent Helpdesk
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setCreateModalVisible(true)}
            className="bg-indigo-600 active:bg-indigo-700 px-3.5 py-2 rounded-xl flex-row items-center shadow-sm"
            accessibilityRole="button"
            accessibilityLabel="Raise new support ticket"
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="text-xs font-bold text-white ml-1">New Ticket</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View className="flex-row gap-2 mb-4">
          {(['all', 'open', 'in_progress', 'resolved'] as const).map((st) => {
            const isSelected = filter === st;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-xl border ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <Text
                  className={`text-xs font-bold capitalize ${
                    isSelected
                      ? 'text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {st.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tickets List */}
        {filteredTickets.length > 0 ? (
          filteredTickets.map((t) => {
            const isResolved = t.status === 'resolved' || t.status === 'closed';
            const isInProgress = t.status === 'in_progress';
            const statusVariant = isResolved ? 'success' : isInProgress ? 'primary' : 'warning';

            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleOpenTicket(t)}
                activeOpacity={0.7}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3 shadow-sm"
              >
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center">
                    <Badge label={t.category.toUpperCase()} variant="neutral" />
                    <Text className="text-[11px] font-bold text-slate-400 ml-2">
                      #{t.ticketNumber || t.id.slice(0, 8)}
                    </Text>
                  </View>
                  <Badge label={t.status.replace('_', ' ').toUpperCase()} variant={statusVariant} />
                </View>

                <Text className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {t.subject}
                </Text>
                <Text className="text-xs text-slate-500 mb-2 leading-relaxed" numberOfLines={2}>
                  {t.description}
                </Text>

                <View className="flex-row items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                  <Text className="text-[10px] text-slate-400">
                    Priority: <Text className="font-bold capitalize">{t.priority}</Text>
                  </Text>
                  <Text className="text-[10px] text-slate-400">
                    {t.createdAt?.slice(0, 10) || 'Recently created'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 items-center text-center mt-2">
            <View className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mb-3">
              <Ionicons name="chatbox-ellipses-outline" size={28} color="#4f46e5" />
            </View>
            <Text className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              No Support Tickets Found
            </Text>
            <Text className="text-xs text-slate-500 max-w-xs text-center mb-4 leading-relaxed">
              Need assistance regarding fees, transportation routes, homework, or general inquiries?
              Tap below to submit a ticket.
            </Text>
            <TouchableOpacity
              onPress={() => setCreateModalVisible(true)}
              className="bg-indigo-600 px-5 py-2.5 rounded-xl"
            >
              <Text className="text-xs font-bold text-white">Create First Ticket</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* CREATE TICKET MODAL */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 shadow-2xl max-h-[85%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-black text-slate-900 dark:text-slate-100">
                Raise Support Ticket
              </Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Category Selector */}
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Category
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {(['general', 'fees', 'transport', 'academics'] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-xl border ${
                    category === c
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold capitalize ${
                      category === c ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Priority Selector */}
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Priority Level
            </Text>
            <View className="flex-row gap-2 mb-3">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl border items-center ${
                    priority === p
                      ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold capitalize ${
                      priority === p
                        ? 'text-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subject Input */}
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Subject
            </Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. Fee installment query for Term 2"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 mb-3"
            />

            {/* Description Input */}
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Detailed Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Provide specific details to help the administration team resolve your ticket..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 mb-5 h-24"
            />

            {/* Submit Action */}
            <TouchableOpacity
              disabled={isSubmitting || !subject.trim() || !description.trim()}
              onPress={handleCreateSubmit}
              className={`py-3.5 rounded-2xl items-center flex-row justify-center ${
                !subject.trim() || !description.trim()
                  ? 'bg-slate-300 dark:bg-slate-800'
                  : 'bg-indigo-600 active:bg-indigo-700'
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-sm font-bold text-white">Submit Support Ticket</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TICKET DETAILS & REPLY MODAL */}
      <Modal
        visible={ticketDetailsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTicketDetailsVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 shadow-2xl h-[90%]">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  #{activeTicket?.ticketNumber || activeTicket?.id?.slice(0, 8)}
                </Text>
                <Text
                  className="text-base font-black text-slate-900 dark:text-slate-100"
                  numberOfLines={1}
                >
                  {activeTicket?.subject}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setTicketDetailsVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Ticket Thread */}
            <ScrollView className="flex-1 mb-3" showsVerticalScrollIndicator={false}>
              {/* Original Ticket Description */}
              <View className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-2xl mb-3">
                <Text className="text-[11px] font-bold text-slate-500 mb-1">Original Inquiry</Text>
                <Text className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                  {activeTicket?.description}
                </Text>
              </View>

              {/* Replies Thread */}
              {activeReplies.map((r) => {
                const isParent = r.authorRole === 'parent';
                return (
                  <View
                    key={r.id}
                    className={`p-3.5 rounded-2xl mb-2.5 max-w-[85%] ${
                      isParent
                        ? 'bg-indigo-600 self-end rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-800 self-start rounded-tl-none'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold mb-1 ${
                        isParent ? 'text-indigo-200' : 'text-slate-500'
                      }`}
                    >
                      {r.authorName} ({r.authorRole})
                    </Text>
                    <Text
                      className={`text-xs leading-relaxed ${
                        isParent ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {r.message}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Reply Composer */}
            <View className="flex-row items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Type your message..."
                placeholderTextColor="#94a3b8"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100"
              />
              <TouchableOpacity
                disabled={isSubmitting || !replyText.trim()}
                onPress={handleSendReply}
                className="bg-indigo-600 px-4 py-2.5 rounded-xl items-center justify-center"
              >
                <Ionicons name="send" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
