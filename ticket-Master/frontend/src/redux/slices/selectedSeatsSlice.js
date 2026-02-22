import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selected: [],
};

const selectedSeatsSlice = createSlice({
  name: 'selectedSeats',
  initialState,
  reducers: {
    setSelectedSeats: (state, action) => {
      state.selected = action.payload || [];
    },
    addSeat: (state, action) => {
      const seat = action.payload;
      if (!state.selected.find(s => s.id === seat.id)) {
        state.selected.push(seat);
      }
    },
    removeSeat: (state, action) => {
      const id = action.payload;
      state.selected = state.selected.filter(s => s.id !== id);
    },
    clearSelectedSeats: (state) => {
      state.selected = [];
    }
  }
});

export const { setSelectedSeats, addSeat, removeSeat, clearSelectedSeats } = selectedSeatsSlice.actions;
export default selectedSeatsSlice.reducer;
