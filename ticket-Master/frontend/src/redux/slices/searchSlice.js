import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const searchEvents = createAsyncThunk(
  'search/searchEvents',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/events', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getSearchSuggestions = createAsyncThunk(
  'search/getSearchSuggestions',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/search/suggestions', { params: { q: query } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  results: [],
  suggestions: [],
  loading: false,
  error: null,
  currentFilters: null,
  totalResults: 0,
  page: 1,
  recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]'),
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    addRecentSearch: (state, action) => {
      const search = action.payload;
      const filtered = state.recentSearches.filter((s) => s.query !== search.query);
      state.recentSearches = [search, ...filtered].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(state.recentSearches));
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
      localStorage.removeItem('recentSearches');
    },
    clearResults: (state) => {
      state.results = [];
      state.totalResults = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // searchEvents
      .addCase(searchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.events || [];
        state.totalResults = action.payload.total || 0;
        state.currentFilters = action.meta.arg;
      })
      .addCase(searchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // getSearchSuggestions
      .addCase(getSearchSuggestions.pending, (state) => {
        state.loading = true;
      })
      .addCase(getSearchSuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestions = action.payload.suggestions || [];
      })
      .addCase(getSearchSuggestions.rejected, (state) => {
        state.loading = false;
        state.suggestions = [];
      });
  },
});

export const { addRecentSearch, clearRecentSearches, clearResults } = searchSlice.actions;
export default searchSlice.reducer;
