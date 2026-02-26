import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import SeatMap from '../components/SeatMap';
import api from '../services/api';
import { toast } from 'react-toastify';

const SeatSelection = () => {
  const { venueId } = useParams();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  const handleReserve = (seat_ids, onSuccess) => {
    api.post('/seats/reserve', { seat_ids, event_id: eventId })
      .then((res) => {
        if (res.conflicts && res.conflicts.length > 0) {
          toast.error(`Some seats could not be reserved: ${res.conflicts.map(c => c.seat_id).join(', ')}`);
        }
        if (res.reserved && res.reserved.length > 0) {
          toast.success(`Reserved ${res.reserved.length} seats`);
          onSuccess && onSuccess();
          // Optionally navigate to checkout with reserved seats
          const params = new URLSearchParams();
          params.set('seats', res.reserved.join(','));
          window.location.href = `/checkout?eventId=${eventId}&${params.toString()}`;
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Reservation failed');
      });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Select Your Seats</h2>
      {!eventId && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-800">No `eventId` provided. Pass `?eventId={'<id>'}` in the URL.</p>
        </div>
      )}
      <SeatMap venueId={venueId} onReserve={handleReserve} />
    </div>
  );
};

export default SeatSelection;
