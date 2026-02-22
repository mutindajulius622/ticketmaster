import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import paymentService from '../../services/paymentService';

const initialState = {
  payments: [],
  loading: false,
  error: null,
  currentOrder: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

export const fetchUserPayments = createAsyncThunk(
  'payments/fetchUserPayments',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await paymentService.getUserPayments({ page, limit });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch payments');
    }
  }
);

export const createPayPalOrder = createAsyncThunk(
  'payments/createPayPalOrder',
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await paymentService.createPayPalOrder(paymentId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create PayPal order');
    }
  }
);

export const capturePayPalOrder = createAsyncThunk(
  'payments/capturePayPalOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await paymentService.capturePayPalOrder(orderId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to capture payment');
    }
  }
);

export const refundPayment = createAsyncThunk(
  'payments/refund',
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await paymentService.refundPayment(paymentId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to refund payment');
    }
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.payments;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUserPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPayPalOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayPalOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(createPayPalOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(capturePayPalOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(capturePayPalOrder.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.payments.findIndex(p => p.id === action.payload.payment.id);
        if (index !== -1) {
          state.payments[index] = action.payload.payment;
        }
        state.currentOrder = null;
      })
      .addCase(capturePayPalOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(refundPayment.fulfilled, (state, action) => {
        const index = state.payments.findIndex(p => p.id === action.payload.payment.id);
        if (index !== -1) {
          state.payments[index] = action.payload.payment;
        }
      });
  },
});

export const { clearError, clearCurrentOrder } = paymentsSlice.actions;
export default paymentsSlice.reducer;
