import React, { createContext, useContext, useState } from 'react';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]); // Array of seat objects { seatNumber, category, price }
  const [lockToken, setLockToken] = useState('');
  const [lockId, setLockId] = useState('');
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);

  const selectSeat = (seat) => {
    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.seatNumber === seat.seatNumber);
      if (exists) {
        return prev.filter((s) => s.seatNumber !== seat.seatNumber);
      }
      if (prev.length >= 10) {
        return prev;
      }
      return [...prev, seat];
    });
  };

  const clearSeats = () => {
    setSelectedSeats([]);
  };

  const resetBookingFlow = () => {
    setSelectedSeats([]);
    setLockToken('');
    setLockId('');
    setLockExpiresAt(null);
    setPendingBooking(null);
  };

  // Subtotal calculation
  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const taxes = Math.round(subtotal * 0.18);
  const fees = selectedSeats.length > 0 ? 20 : 0;
  const totalAmount = subtotal + taxes + fees;

  return (
    <BookingContext.Provider
      value={{
        selectedMovie,
        setSelectedMovie,
        selectedShow,
        setSelectedShow,
        selectedSeats,
        selectSeat,
        clearSeats,
        lockToken,
        setLockToken,
        lockId,
        setLockId,
        lockExpiresAt,
        setLockExpiresAt,
        pendingBooking,
        setPendingBooking,
        resetBookingFlow,
        subtotal,
        taxes,
        fees,
        totalAmount,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
