import { useHelpdeskStore } from '../../src/stores/helpdesk.store';
import { helpdeskApi, HelpdeskTicket } from '../../src/api/helpdesk.api';

jest.mock('../../src/api/helpdesk.api');

describe('Helpdesk & Communication Module Test Suite', () => {
  beforeEach(() => {
    useHelpdeskStore.getState().clear();
    jest.clearAllMocks();
  });

  const mockTickets: HelpdeskTicket[] = [
    {
      id: 'ticket-1',
      ticketNumber: 'TKT-2026-001',
      category: 'fees',
      priority: 'high',
      status: 'open',
      subject: 'Quarter 2 payment receipt query',
      description: 'Need official payment receipt for reimbursement',
      createdAt: '2026-11-01T09:00:00Z',
      updatedAt: '2026-11-01T09:00:00Z',
    },
    {
      id: 'ticket-2',
      ticketNumber: 'TKT-2026-002',
      category: 'transport',
      priority: 'medium',
      status: 'resolved',
      subject: 'Morning bus stop adjustment',
      description: 'Requesting pickup from Stop 5',
      createdAt: '2026-10-25T08:00:00Z',
      updatedAt: '2026-10-26T14:00:00Z',
    },
  ];

  describe('1. Ticket List & Filters', () => {
    it('should initialize with filter set to all and empty tickets', () => {
      const state = useHelpdeskStore.getState();
      expect(state.filter).toBe('all');
      expect(state.tickets).toEqual([]);
      expect(state.isLoading).toBe(false);
    });

    it('should switch status filter correctly', () => {
      const { setFilter } = useHelpdeskStore.getState();

      setFilter('open');
      expect(useHelpdeskStore.getState().filter).toBe('open');

      setFilter('resolved');
      expect(useHelpdeskStore.getState().filter).toBe('resolved');
    });

    it('should fetch and store helpdesk tickets from API', async () => {
      (helpdeskApi.getTickets as jest.Mock).mockResolvedValue(mockTickets);

      await useHelpdeskStore.getState().fetchTickets();

      const state = useHelpdeskStore.getState();
      expect(state.tickets).toHaveLength(2);
      expect(state.tickets[0].subject).toBe('Quarter 2 payment receipt query');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('2. Ticket Conversation & Threading', () => {
    it('should fetch ticket details and reply thread', async () => {
      const mockTicket = mockTickets[0];
      const mockReplies = [
        {
          id: 'rep-1',
          ticketId: 'ticket-1',
          authorName: 'Parent Guardian',
          authorRole: 'parent' as const,
          message: 'Can this be sent as a stamped PDF?',
          createdAt: '2026-11-01T10:00:00Z',
        },
        {
          id: 'rep-2',
          ticketId: 'ticket-1',
          authorName: 'Accounts Officer',
          authorRole: 'support' as const,
          message: 'The digital receipt is available under the Finance tab.',
          createdAt: '2026-11-01T11:00:00Z',
        },
      ];

      (helpdeskApi.getTicketById as jest.Mock).mockResolvedValue(mockTicket);
      (helpdeskApi.getTicketReplies as jest.Mock).mockResolvedValue(mockReplies);

      await useHelpdeskStore.getState().fetchTicketDetails('ticket-1');

      const state = useHelpdeskStore.getState();
      expect(state.activeTicket).toEqual(mockTicket);
      expect(state.activeReplies).toHaveLength(2);
      expect(state.isLoading).toBe(false);
    });

    it('should append reply to active thread on sendReply()', async () => {
      useHelpdeskStore.setState({
        activeTicket: mockTickets[0],
        activeReplies: [],
      });

      const newReply = {
        id: 'rep-3',
        ticketId: 'ticket-1',
        authorName: 'Parent Guardian',
        authorRole: 'parent' as const,
        message: 'Understood, thank you!',
        createdAt: '2026-11-01T12:00:00Z',
      };

      (helpdeskApi.addReply as jest.Mock).mockResolvedValue(newReply);

      const success = await useHelpdeskStore
        .getState()
        .sendReply('ticket-1', 'Understood, thank you!');

      expect(success).toBe(true);
      expect(helpdeskApi.addReply).toHaveBeenCalledWith('ticket-1', 'Understood, thank you!');
      expect(useHelpdeskStore.getState().activeReplies).toContainEqual(newReply);
    });

    it('should reject empty reply string without calling API', async () => {
      const success = await useHelpdeskStore.getState().sendReply('ticket-1', '   ');
      expect(success).toBe(false);
      expect(helpdeskApi.addReply).not.toHaveBeenCalled();
    });
  });

  describe('3. Ticket Creation', () => {
    it('should create new ticket and prepend to list', async () => {
      useHelpdeskStore.setState({ tickets: [mockTickets[1]] });

      const createdTicket: HelpdeskTicket = {
        id: 'ticket-new',
        ticketNumber: 'TKT-2026-999',
        category: 'academics',
        priority: 'medium',
        status: 'open',
        subject: 'Doubt in Mathematics syllabus',
        description: 'Need clarification on chapter 4',
        createdAt: '2026-11-02T10:00:00Z',
        updatedAt: '2026-11-02T10:00:00Z',
      };

      (helpdeskApi.createTicket as jest.Mock).mockResolvedValue(createdTicket);

      const success = await useHelpdeskStore.getState().createTicket({
        category: 'academics',
        priority: 'medium',
        subject: 'Doubt in Mathematics syllabus',
        description: 'Need clarification on chapter 4',
      });

      expect(success).toBe(true);
      const state = useHelpdeskStore.getState();
      expect(state.tickets).toHaveLength(2);
      expect(state.tickets[0].id).toBe('ticket-new');
    });
  });

  describe('4. Store Reset', () => {
    it('should purge all helpdesk state on clear()', () => {
      useHelpdeskStore.setState({
        tickets: mockTickets,
        filter: 'open',
        isError: true,
      });

      useHelpdeskStore.getState().clear();

      const state = useHelpdeskStore.getState();
      expect(state.tickets).toEqual([]);
      expect(state.filter).toBe('all');
      expect(state.isError).toBe(false);
    });
  });
});
