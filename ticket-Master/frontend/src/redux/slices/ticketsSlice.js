import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ticketService from '../../services/ticketService';

const initialState = {
  tickets: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

export const fetchUserTickets = createAsyncThunk(
  'tickets/fetchUserTickets',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await ticketService.getUserTickets({ page, limit });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch tickets');
    }
  }
);

export const purchaseTicket = createAsyncThunk(
  'tickets/purchaseTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      const response = await ticketService.purchaseTicket(ticketData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to purchase ticket');
    }
  }
);

export const cancelTicket = createAsyncThunk(
  'tickets/cancelTicket',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await ticketService.cancelTicket(ticketId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to cancel ticket');
    }
  }
);

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload.tickets;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUserTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(purchaseTicket.fulfilled, (state, action) => {
        state.tickets.push(...action.payload.tickets);
      })
      .addCase(cancelTicket.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(t => t.id === action.payload.ticket.id);
        if (index !== -1) {
          state.tickets[index] = action.payload.ticket;
        }
      });
  },
});

export const { clearError } = ticketsSlice.actions;
export default ticketsSlice.reducer;
