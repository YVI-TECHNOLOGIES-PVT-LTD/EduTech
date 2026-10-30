import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  HelpCircle,
  Plus,
  RefreshCw,
  Send,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Lock,
  MessageSquare,
  Filter,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

const GLASS_CARD =
  'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm transition-all';

export const FinanceCommunicationHelpdesk: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketDetails, setTicketDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Message reply state
  const [replyText, setReplyText] = useState('');
  const [messageType, setMessageType] = useState<'public_reply' | 'internal_note'>('public_reply');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Create ticket modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newPriority, setNewPriority] = useState('normal');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const fetchCategories = async () => {
    try {
      const res: any = await apiClient.get('/fees/communication/helpdesk/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res: any = await apiClient.get(`/fees/communication/helpdesk/tickets${query}`);
      setTickets(res.tickets || res.data?.tickets || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      toast.error('Failed to load helpdesk tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    try {
      setLoadingDetails(true);
      const res: any = await apiClient.get(
        `/fees/communication/helpdesk/tickets/${ticket.ticket_id}`,
      );
      setTicketDetails(res.data);
    } catch (err) {
      toast.error('Failed to load ticket details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      setSubmittingReply(true);
      await apiClient.post(
        `/fees/communication/helpdesk/tickets/${selectedTicket.ticket_id}/messages`,
        {
          content: replyText.trim(),
          message_type: messageType,
        },
      );

      toast.success(messageType === 'internal_note' ? 'Internal note added' : 'Reply sent');
      setReplyText('');
      // Refresh ticket details
      const res: any = await apiClient.get(
        `/fees/communication/helpdesk/tickets/${selectedTicket.ticket_id}`,
      );
      setTicketDetails(res.data);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/fees/communication/helpdesk/tickets/${ticketId}/status`, {
        status: newStatus,
        note: `Status updated to ${newStatus}`,
      });
      toast.success(`Ticket status updated to ${newStatus}`);
      if (selectedTicket && selectedTicket.ticket_id === ticketId) {
        const res: any = await apiClient.get(`/fees/communication/helpdesk/tickets/${ticketId}`);
        setTicketDetails(res.data);
      }
      fetchTickets();
    } catch (err: any) {
      toast.error('Failed to update ticket status');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newCategoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmittingTicket(true);
      await apiClient.post('/fees/communication/helpdesk/tickets', {
        title: newTitle.trim(),
        description: newDescription.trim(),
        category_id: newCategoryId,
        priority: newPriority,
        ticket_type: 'staff_on_behalf',
      });

      toast.success('Ticket created successfully');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create ticket');
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Helpdesk & Support Tickets
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Resolve student and parent inquiries, track resolution SLAs, and post internal notes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
        {[
          'all',
          'open',
          'in_progress',
          'escalated',
          'waiting_for_parent',
          'resolved',
          'closed',
        ].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
              statusFilter === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className={`${GLASS_CARD} p-8 text-center`}>
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                No tickets found
              </p>
            </div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.ticket_id}
                onClick={() => handleSelectTicket(t)}
                className={`${GLASS_CARD} p-4 cursor-pointer hover:border-indigo-500 transition-all ${
                  selectedTicket?.ticket_id === t.ticket_id ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {t.ticket_number || 'TICKET'}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      t.priority === 'urgent'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : t.priority === 'high'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                  {t.title}
                </h4>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{t.helpdesk_categories?.category_name || 'General'}</span>
                  <span className="capitalize">{t.status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detailed View */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className={`${GLASS_CARD} p-6 space-y-6`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {ticketDetails?.ticket_number || selectedTicket.ticket_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        ticketDetails?.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : ticketDetails?.status === 'escalated'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {ticketDetails?.status || selectedTicket.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {ticketDetails?.title || selectedTicket.title}
                  </h2>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={ticketDetails?.status || selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(selectedTicket.ticket_id, e.target.value)}
                    className="text-xs px-2.5 py-1.5 border rounded-lg dark:bg-slate-800 dark:border-white/10 dark:text-white font-medium"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_for_parent">Waiting for Parent</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Message thread */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {loadingDetails ? (
                  <div className="text-center py-8 text-slate-400 text-sm">Loading thread...</div>
                ) : ticketDetails?.helpdesk_messages?.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-4">
                    No messages in ticket.
                  </div>
                ) : (
                  ticketDetails?.helpdesk_messages?.map((m: any) => {
                    const isInternal = m.message_type === 'internal_note';
                    return (
                      <div
                        key={m.message_id}
                        className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
                          isInternal
                            ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50'
                            : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            {isInternal && <Lock className="w-3 h-3 text-amber-600" />}
                            {isInternal ? 'Internal Staff Note' : 'Public Reply'}
                          </span>
                          <span>{new Date(m.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                          {m.content || m.body}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleAddReply}
                className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3"
              >
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="msg_type"
                      checked={messageType === 'public_reply'}
                      onChange={() => setMessageType('public_reply')}
                    />
                    <span>Public Reply (Visible to requester)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="msg_type"
                      checked={messageType === 'internal_note'}
                      onChange={() => setMessageType('internal_note')}
                    />
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      Internal Note (Staff Only)
                    </span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      messageType === 'internal_note'
                        ? 'Write a private note for staff...'
                        : 'Write a response to the requester...'
                    }
                    className="flex-1 px-3 py-2 text-xs border rounded-xl dark:bg-slate-800 dark:border-white/10 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={submittingReply}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium self-end"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className={`${GLASS_CARD} p-16 text-center text-slate-500`}>
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium">
                Select a ticket from the list to view its full conversation and history.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-white/10 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="Brief summary of inquiry"
                  className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-800 dark:border-white/10 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-800 dark:border-white/10 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-800 dark:border-white/10 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Initial Description *
                </label>
                <textarea
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
                  placeholder="Detailed description of the issue or question..."
                  className="w-full px-3 py-2 border rounded-xl text-sm dark:bg-slate-800 dark:border-white/10 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
                >
                  {submittingTicket ? 'Creating...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceCommunicationHelpdesk;
