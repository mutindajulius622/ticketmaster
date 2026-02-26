import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import eventsReducer from './slices/eventsSlice';
import ticketsReducer from './slices/ticketsSlice';
import paymentsReducer from './slices/paymentsSlice';
import uiReducer from './slices/uiSlice';
import searchReducer from './slices/searchSlice';
import selectedSeatsReducer from './slices/selectedSeatsSlice';
import usersReducer from './slices/usersSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    tickets: ticketsReducer,
    payments: paymentsReducer,
    ui: uiReducer,
    search: searchReducer,
    selectedSeats: selectedSeatsReducer,
    users: usersReducer,
  },
});

export default store;
