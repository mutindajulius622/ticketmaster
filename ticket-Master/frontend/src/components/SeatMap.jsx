import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { addSeat, removeSeat, setSelectedSeats, clearSelectedSeats } from '../redux/slices/selectedSeatsSlice';

const Seat = ({ seat, onToggle }) => {
  const statusClass = {
    AVAILABLE: 'bg-green-500 hover:bg-green-600',
    RESERVED: 'bg-yellow-400',
    SOLD: 'bg-gray-400',
    BLOCKED: 'bg-red-400',
  }[seat.status] || 'bg-gray-200';

  return (
    <button
      className={`w-10 h-10 rounded-sm text-xs text-white ${statusClass} flex items-center justify-center`}
      onClick={() => onToggle(seat)}
      disabled={seat.status !== 'AVAILABLE'}
      title={`Row ${seat.row} Seat ${seat.seat_number} - $${seat.price}`}
    >
      {seat.row}-{seat.seat_number}
    </button>
  );
};

const SeatMap = ({ venueId, onReserve }) => {
  const [sections, setSections] = useState([]);
  const dispatch = useDispatch();
  const selected = useSelector(state => state.selectedSeats.selected || []);
  const [localSelected, setLocalSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!venueId) return;
    setLoading(true);
    api.get(`/seats/venue/${venueId}/seatmap`)
      .then((res) => {
        setSections(res.sections || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [venueId]);

  const toggleSeat = (seat) => {
    const exists = selected.find((s) => s.id === seat.id);
    if (exists) {
      dispatch(removeSeat(seat.id));
      setLocalSelected(localSelected.filter((s) => s.id !== seat.id));
    } else {
      dispatch(addSeat(seat));
      setLocalSelected([...localSelected, seat]);
    }
  };

  const handleReserve = () => {
    const seatsToUse = selected.length ? selected : localSelected;
    if (seatsToUse.length === 0) return;
    const seat_ids = seatsToUse.map((s) => s.id);
    onReserve(seat_ids, () => {
      dispatch(clearSelectedSeats());
      setLocalSelected([]);
    });
  };

  if (loading) return <div>Loading seat map...</div>;

  return (
    <div className="space-y-6">
      {sections.map((sec) => (
        <div key={sec.section.id} className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-semibold mb-3">{sec.section.name}</h4>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${sec.section.seats_per_row}, 1fr)` }}>
                {sec.seats.map((seat) => (
                  <Seat key={seat.id} seat={seat} onToggle={toggleSeat} />
                ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-2">
        <button onClick={() => setSelected([])} className="px-4 py-2 border rounded">Clear</button>
        <button onClick={handleReserve} className="px-4 py-2 bg-blue-600 text-white rounded">Reserve Selected ({selected.length})</button>
      </div>
    </div>
  );
};

export default SeatMap;
