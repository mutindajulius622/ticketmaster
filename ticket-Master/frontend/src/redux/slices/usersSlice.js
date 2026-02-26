import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async ({ page = 1, limit = 10, search = '' }, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            const response = await axios.get(`${API_URL}/admin/users`, {
                params: { page, limit, search },
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch users');
        }
    }
);

export const promoteUser = createAsyncThunk(
    'users/promoteUser',
    async (userId, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            const response = await axios.post(`${API_URL}/admin/users/${userId}/promote`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to promote user');
        }
    }
);

export const demoteUser = createAsyncThunk(
    'users/demoteUser',
    async (userId, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            const response = await axios.post(`${API_URL}/admin/users/${userId}/demote`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to demote user');
        }
    }
);

export const deleteUser = createAsyncThunk(
    'users/deleteUser',
    async (userId, { getState, rejectWithValue }) => {
        try {
            const { auth: { token } } = getState();
            const response = await axios.delete(`${API_URL}/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return userId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to delete user');
        }
    }
);

const usersSlice = createSlice({
    name: 'users',
    initialState: {
        users: [],
        pagination: { page: 1, total: 0, pages: 0 },
        loading: false,
        error: null,
    },
    reducers: {
        clearUserError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload.users;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(promoteUser.fulfilled, (state, action) => {
                const index = state.users.findIndex(u => u.id === action.payload.user.id);
                if (index !== -1) {
                    state.users[index] = action.payload.user;
                }
            })
            .addCase(demoteUser.fulfilled, (state, action) => {
                const index = state.users.findIndex(u => u.id === action.payload.user.id);
                if (index !== -1) {
                    state.users[index] = action.payload.user;
                }
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.users = state.users.filter(u => u.id !== action.payload);
            });
    }
});

export const { clearUserError } = usersSlice.actions;
export default usersSlice.reducer;
