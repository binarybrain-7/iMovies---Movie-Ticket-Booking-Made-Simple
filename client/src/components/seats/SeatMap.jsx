import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { FiZoomIn, FiZoomOut } from 'react-icons/fi';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

// Crisp inline SVG wheelchair icon matching Image 2
const WheelchairIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#8E9AA8"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="4" r="2" />
    <path d="M16 11V7a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2v8h4" />
    <path d="M8 20a4 4 0 1 0 7.8-1.5" />
    <path d="M15 17h4a2 2 0 0 0 2-2v-4" />
  </svg>
);

const SeatMap = ({ show, seats = [], selectedSeats = [], onSeatToggle }) => {
  const { user } = useAuth();
  const [liveSeats, setLiveSeats] = useState(seats);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Sync prop changes
  useEffect(() => {
    setLiveSeats(seats);
  }, [seats]);

  // Connect to Socket.IO for real-time seat locks and releases
  useEffect(() => {
    if (!show?._id) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.emit('join_show', show._id);

    socket.on('seat_locked', (data) => {
      if (data.showId === show._id && data.userId !== user?._id) {
        setLiveSeats((prev) =>
          prev.map((s) => {
            if (data.seats.includes(s.seatNumber)) {
              return { ...s, status: 'locked' };
            }
            return s;
          })
        );
      }
    });

    socket.on('seat_released', (data) => {
      if (data.showId === show._id) {
        setLiveSeats((prev) =>
          prev.map((s) => {
            if (data.seats.includes(s.seatNumber)) {
              return { ...s, status: 'available' };
            }
            return s;
          })
        );
      }
    });

    socket.on('seats_booked', (data) => {
      if (data.showId === show._id) {
        setLiveSeats((prev) =>
          prev.map((s) => {
            if (data.seats.includes(s.seatNumber)) {
              return { ...s, status: 'booked' };
            }
            return s;
          })
        );
      }
    });

    return () => {
      socket.emit('leave_show', show._id);
      socket.disconnect();
    };
  }, [show?._id, user?._id]);

  // Cinepolis tier order from top to bottom matching Image 2:
  // RECLINER (Row L) -> PREMIUM PLUS (Row K) -> PREMIUM XL (Row J) -> PREMIUM (Rows I,H,G,F,E) -> EXECUTIVE (Rows D,C,B) -> NORMAL (Row A)
  const TIER_ORDER = [
    'Recliner',
    'Premium Plus',
    'Premium XL',
    'Premium',
    'Executive',
    'Normal',
    'Balcony',
    'Middle',
    'Lower',
  ];

  // Map categories present in liveSeats according to tier order
  const categoriesPresent = TIER_ORDER.filter((cat) =>
    liveSeats.some((s) => s.category?.toLowerCase() === cat.toLowerCase())
  );
  const finalCategories = categoriesPresent.length > 0
    ? categoriesPresent
    : Array.from(new Set(liveSeats.map((s) => s.category || 'Standard')));

  const getSeatsByCategory = (category) => {
    return liveSeats.filter(
      (s) => s.category?.toLowerCase() === category.toLowerCase()
    );
  };

  // Group seats by row, sorting rows in cinema order (descending L to A so screen is at bottom, or descending)
  const getRowsForSeats = (categorySeats) => {
    const rowMap = new Map();
    categorySeats.forEach((s) => {
      if (!rowMap.has(s.row)) {
        rowMap.set(s.row, []);
      }
      rowMap.get(s.row).push(s);
    });

    // Sort rows descending so top rows (e.g. L) are at top and bottom rows (e.g. A) are near screen at bottom
    return Array.from(rowMap.entries()).sort(([rowA], [rowB]) => rowB.localeCompare(rowA));
  };

  const isSelected = (seatNumber) => {
    return selectedSeats.some((s) => s.seatNumber === seatNumber);
  };

  // Partition row seats into distinct cinema blocks with walkway aisles
  // Matching the Cinepolis Bansal Plaza geometry shown in Image 2
  const splitRowIntoBlocks = (rowSeats, rowLabel) => {
    // Sort seats descending by number (e.g. 19 down to 1, 15 down to 1, 11 down to 1)
    const sorted = [...rowSeats].sort((a, b) => b.number - a.number);
    const count = sorted.length;

    if (rowLabel === 'L') {
      // Row L: RECLINER (11 seats) arranged in couples/pods: [11, 10] | [9, 8] | [7, 6] | [5, 4] | [3, 2] | [1]
      return [
        sorted.slice(0, 2),
        sorted.slice(2, 4),
        sorted.slice(4, 6),
        sorted.slice(6, 8),
        sorted.slice(8, 10),
        sorted.slice(10),
      ].filter((b) => b.length > 0);
    }

    if (rowLabel === 'K') {
      // Row K: PREMIUM PLUS (15 seats): [15, 14] | [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3] | [2, 1]
      return [
        sorted.slice(0, 2),
        sorted.slice(2, 13),
        sorted.slice(13),
      ].filter((b) => b.length > 0);
    }

    if (rowLabel === 'J') {
      // Row J: PREMIUM XL (13 seats): [13, 12, 11, 10] | [9, 8, 7, 6, 5, 4, 3] | [2, 1]
      // Note: Seats 9 and 6 are wheelchair accessible in the center block
      return [
        sorted.slice(0, 4),
        sorted.slice(4, 11),
        sorted.slice(11),
      ].filter((b) => b.length > 0);
    }

    if (['I', 'H', 'G', 'F', 'E'].includes(rowLabel)) {
      // Rows I, H, G, F, E: PREMIUM (17 to 19 seats)
      // Left block: [19, 18, 17]
      // Center viewing block: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7]
      // Right wing block: [6, 5, 4, 3] (or [6, 5, 4, 3, 2, 1])
      if (count >= 16) {
        return [
          sorted.slice(0, 3),
          sorted.slice(3, 13),
          sorted.slice(13),
        ].filter((b) => b.length > 0);
      }
    }

    if (['D', 'C', 'B', 'A'].includes(rowLabel)) {
      // Rows D, C, B, A: EXECUTIVE & NORMAL (15 seats)
      // Main block: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3]
      // Aisle gap on the right
      // Right block: [2, 1]
      if (count >= 14) {
        return [
          sorted.slice(0, count - 2),
          sorted.slice(count - 2),
        ].filter((b) => b.length > 0);
      }
    }

    // Generic fallback for any other seating block configuration
    if (count >= 14) {
      return [
        sorted.slice(0, 2),
        sorted.slice(2, count - 2),
        sorted.slice(count - 2),
      ].filter((b) => b.length > 0);
    } else if (count >= 6) {
      return [
        sorted.slice(0, 2),
        sorted.slice(2, count - 2),
        sorted.slice(count - 2),
      ].filter((b) => b.length > 0);
    }

    return [sorted];
  };

  // Render an individual seat button
  const renderSeat = (seat, isPrimeTier) => {
    const selected = isSelected(seat.seatNumber);
    const isBooked = seat.status === 'booked';
    const isLocked = seat.status === 'locked' && !selected;

    // Detect prime center viewing angle seats (Rows I, H, G, F in center block) matching Image 2 blue outline
    const isPrime = (
      (seat.row === 'I' && seat.number >= 7 && seat.number <= 16) ||
      (seat.row === 'H' && seat.number >= 7 && seat.number <= 15) ||
      (seat.row === 'G' && seat.number >= 7 && seat.number <= 14) ||
      (seat.row === 'F' && seat.number >= 7 && seat.number <= 12)
    );

    // Designated wheelchair accessible seats matching Image 2 (Row J, seats 9 and 6)
    const isWheelchair = (seat.row === 'J' && (seat.number === 9 || seat.number === 6)) ||
                         (seat.row === 'C' && (seat.number === 8 || seat.number === 6));

    let seatClasses = 'cinema-seat-btn';
    if (selected) {
      seatClasses += ' selected';
    } else if (isBooked) {
      seatClasses += ' booked';
    } else if (isLocked) {
      seatClasses += ' locked';
    } else {
      seatClasses += ' available';
      if (isPrime) seatClasses += ' prime';
    }

    return (
      <button
        key={seat.seatNumber}
        type="button"
        className={seatClasses}
        disabled={isBooked || isLocked}
        onClick={() => onSeatToggle(seat)}
        title={`${seat.seatNumber} — ₹${seat.price} (${seat.category || 'Standard'}) ${isWheelchair ? '♿ Wheelchair Accessible' : ''}`}
        aria-label={`Seat ${seat.seatNumber}`}
      >
        {isWheelchair && !selected && !isBooked ? (
          <WheelchairIcon />
        ) : (
          seat.number
        )}
      </button>
    );
  };


  return (
    <div className="cinema-auditorium position-relative px-1 py-2">
      {/* Zoom / Viewport controls */}
      <div className="d-flex justify-content-end align-items-center gap-2 mb-2 px-3">
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.max(0.75, +(z - 0.1).toFixed(1)))}
          className="btn btn-sm btn-outline-secondary p-1 rounded-circle d-flex align-items-center justify-content-center text-muted border-secondary"
          style={{ width: '26px', height: '26px' }}
          title="Zoom Out"
        >
          <FiZoomOut size={13} />
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel(1)}
          className="btn btn-sm btn-outline-secondary px-2 py-0 rounded text-muted border-secondary"
          style={{ fontSize: '0.7rem', height: '26px' }}
          title="Reset Zoom"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.min(1.25, +(z + 0.1).toFixed(1)))}
          className="btn btn-sm btn-outline-secondary p-1 rounded-circle d-flex align-items-center justify-content-center text-muted border-secondary"
          style={{ width: '26px', height: '26px' }}
          title="Zoom In"
        >
          <FiZoomIn size={13} />
        </button>
      </div>

      {/* Seat Legend matching Section 9 & Image 2 */}
      <div
        className="d-flex flex-wrap justify-content-center align-items-center gap-3 gap-sm-4 mb-3"
        style={{ fontSize: '0.72rem', color: '#9E9EA8' }}
      >
        <div className="d-flex align-items-center gap-2">
          <div className="cinema-seat-btn available" style={{ width: '18px', height: '17px', cursor: 'default' }} />
          <span>Available</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="cinema-seat-btn selected" style={{ width: '18px', height: '17px', cursor: 'default' }} />
          <span>Selected</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="cinema-seat-btn locked" style={{ width: '18px', height: '17px', cursor: 'default' }} />
          <span>Reserved (Live)</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="cinema-seat-btn booked" style={{ width: '18px', height: '17px', cursor: 'default' }} />
          <span>Booked</span>
        </div>
      </div>

      {/* Auditorium Seating Grid with Zoom & Pan */}
      <div
        className="auditorium-scroll-container overflow-auto pb-3"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease',
        }}
      >
        {finalCategories.map((cat) => {
          const catSeats = getSeatsByCategory(cat);
          if (!catSeats.length) return null;
          const rows = getRowsForSeats(catSeats);
          const price = show?.seatPricing?.[cat] || catSeats[0]?.price || 210;
          const isPrimeTier = cat.toLowerCase().includes('premium') || cat.toLowerCase().includes('middle');

          return (
            <div key={cat} className="mb-3">
              {/* Centered Tier Heading with Category & Price (e.g. RECLINER: ₹690) */}
              <div className="cinema-tier-heading">
                {cat.toUpperCase()}: ₹{price}
              </div>

              {/* Seating Rows with left letter, descending numbers, and walkway aisles */}
              <div className="d-flex flex-column align-items-center">
                {rows.map(([rowLabel, rowSeats]) => {
                  const blocks = splitRowIntoBlocks(rowSeats, rowLabel);

                  return (
                    <div key={rowLabel} className="cinema-row-container">
                      {/* Left Row Label */}
                      <span className="cinema-row-label">{rowLabel}</span>

                      {/* Render blocks of seats with aisle gaps in between */}
                      {blocks.map((block, bIdx) => (
                        <React.Fragment key={bIdx}>
                          {bIdx > 0 && <div className="cinema-aisle-gap" />}
                          <div className="d-flex gap-1">
                            {block.map((seat) => renderSeat(seat, isPrimeTier))}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}

        {/* CURVED PURPLE CINEMA SCREEN AT THE BOTTOM (FACING UPWARDS TOWARDS AUDIENCE) */}
        <div className="cinema-bottom-screen-wrap">
          <div className="cinema-bottom-screen-arc" />
          <div className="cinema-bottom-screen-text">
            All eyes this way — Cinema Screen
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
