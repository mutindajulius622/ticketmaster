import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import eventService from '../../services/eventService';

const initialState = {
  events: [],
  currentEvent: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  savedEvents: [],
  filters: {
    category: null,
    location: null,
    search: null,
    status: 'published',
  },
};

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async ({ page = 1, limit = 10, ...filters }, { rejectWithValue }) => {
    try {
      const response = await eventService.getEvents({ page, limit, ...filters });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch events');
    }
  }
);

export const fetchEventDetail = createAsyncThunk(
  'events/fetchEventDetail',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await eventService.getEvent(eventId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch event');
    }
  }
);

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData, { rejectWithValue }) => {
    try {
      const response = await eventService.createEvent(eventData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create event');
    }
  }
);

export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ eventId, eventData }, { rejectWithValue }) => {
    try {
      const response = await eventService.updateEvent(eventId, eventData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update event');
    }
  }
);

export const fetchSavedEvents = createAsyncThunk(
  'events/fetchSavedEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventService.getSavedEvents();
      return response.events;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch saved events');
    }
  }
);

export const toggleSaveEvent = createAsyncThunk(
  'events/toggleSaveEvent',
  async ({ eventId, isSaved }, { rejectWithValue }) => {
    try {
      if (isSaved) {
        await eventService.unsaveEvent(eventId);
      } else {
        await eventService.saveEvent(eventId);
      }
      return { eventId, isSaved: !isSaved };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Action failed');
    }
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEventDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.events.push(action.payload);
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        const index = state.events.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      .addCase(fetchSavedEvents.fulfilled, (state, action) => {
        state.savedEvents = action.payload;
      })
      .addCase(toggleSaveEvent.fulfilled, (state, action) => {
        const { eventId, isSaved } = action.payload;
        if (isSaved) {
          // If we just saved it, we might want to refresh savedEvents list
        } else {
          // If we unsaved it, remove from list
          state.savedEvents = state.savedEvents.filter(e => e.id !== eventId);
        }
      });
  },
});

export const { setFilters, clearFilters, clearError } = eventsSlice.actions;
export default eventsSlice.reducer;
