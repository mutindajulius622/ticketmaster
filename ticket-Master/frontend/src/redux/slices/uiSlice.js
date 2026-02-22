import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  showModal: false,
  modalType: null,
  notification: null,
  darkMode: localStorage.getItem('darkMode') === 'true',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    openModal: (state, action) => {
      state.showModal = true;
      state.modalType = action.payload;
    },
    closeModal: (state) => {
      state.showModal = false;
      state.modalType = null;
    },
    showNotification: (state, action) => {
      state.notification = action.payload;
    },
    clearNotification: (state) => {
      state.notification = null;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
    },
  },
});

export const {
  setLoading,
  openModal,
  closeModal,
  showNotification,
  clearNotification,
  toggleDarkMode,
} = uiSlice.actions;

export default uiSlice.reducer;
