import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { showService } from '../services/showService';
import { bookingService } from '../services/bookingService';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/seats/SeatMap';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import {
  FiArrowLeft,
  FiShare2,
  FiInfo,
  FiX,
  FiChevronRight,
  FiTag,
  FiCheck,
} from 'react-icons/fi';

const PARTNER_OFFERS = [
  {
    id: 'axis-bogo',
    bank: 'Axis Bank',
    title: 'Buy 1 Get 1 Free on Select Credit Cards',
    code: 'AXISBOGO',
    discount: 'Up to ₹250 off on 2nd ticket',
    badge: 'Popular',
  },
  {
    id: 'visa-infinite',
    bank: 'Visa Cards',
    title: 'Flat 20% Off on Visa Signature & Infinite Cards',
    code: 'VISA20',
    discount: 'Up to ₹150 off on 2+ tickets',
    badge: 'Exclusive',
  },
  {
    id: 'icici-debit',
    bank: 'ICICI Bank',
    title: '25% Instant Discount on Debit Cards',
    code: 'ICICI25',
    discount: 'Max discount ₹100',
    badge: 'Limited',
  },
  {
    id: 'rupay-select',
    bank: 'RuPay',
    title: '50% Off on RuPay Select Credit Cards',
    code: 'RUPAY50',
    discount: 'Up to ₹150 off per month',
    badge: 'Weekend',
  },
  {
    id: 'paytm-upi',
    bank: 'Paytm UPI',
    title: 'Flat ₹50 Cashback on First Booking',
    code: 'PAYTM50',
    discount: 'Valid on min ₹300 booking',
    badge: 'Instant',
  },
];

const SeatSelection = () => {
  const [searchParams] = useSearchParams();
  const showId = searchParams.get('showId');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const {
    selectedShow,
    setSelectedShow,
    selectedSeats,
    selectSeat,
    clearSeats,
    setLockToken,
    setLockId,
    setLockExpiresAt,
    setPendingBooking,
    subtotal,
    taxes,
    fees,
    totalAmount,
  } = useBooking();

  const [seatData, setSeatData] = useState(null);
  const [show, setShow] = useState(selectedShow);
  const [siblingShows, setSiblingShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [appliedOffer, setAppliedOffer] = useState(null);

  const fetchSeatData = async () => {
    try {
      setLoading(true);
      const [showRes, seatsRes] = await Promise.all([
        showService.getShowById(showId),
        showService.getShowSeats(showId),
      ]);

      const currentShow = showRes.data.show;
      setShow(currentShow);
      setSelectedShow(currentShow);
      setSeatData(seatsRes.data);

      // Fetch other showtimes for this movie on the same date for the showtime pill bar
      if (currentShow?.movieId?._id && currentShow?.showDate) {
        try {
          const sibRes = await showService.getShows({
            movieId: currentShow.movieId._id,
            showDate: currentShow.showDate,
          });
          const allShows = sibRes.data.shows || [];
          const sameTheatreShows = allShows.filter(
            (s) => s.theatreId?._id === currentShow.theatreId?._id
          );
          setSiblingShows(sameTheatreShows.length > 0 ? sameTheatreShows : allShows);
        } catch (e) {
          console.warn('Could not load sibling shows:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load seat layout:', err);
      toast.error('Unable to load seat availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showId) {
      navigate('/movies');
      return;
    }
    clearSeats();
    fetchSeatData();
  }, [showId]);

  const handleSeatToggle = (seat) => {
    selectSeat(seat);
  };

  const handleShareSeatMap = async () => {
    const url = window.location.href;
    const shareData = {
      title: `${show?.movieId?.title || 'Movie'} Seat Map - IMovies`,
      text: `Select your seats for ${show?.movieId?.title} at ${show?.theatreId?.name}!`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed, falling back to clipboard:', err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Seat map link copied to clipboard!');
    } catch (err) {
      toast.info(`Share link: ${url}`);
    }
  };

  const handleApplyOffer = (offer) => {
    setAppliedOffer(offer);
    setShowOffersModal(false);
    toast.success(`Applied ${offer.code} — ${offer.discount}`);
  };

  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to complete your booking reservation');
      navigate('/login', { state: { from: `/seat-selection?showId=${showId}` } });
      return;
    }

    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat to proceed');
      return;
    }

    try {
      setLocking(true);
      const seatNumbers = selectedSeats.map((s) => s.seatNumber);

      // 1. Acquire server temporary seat lock (5 mins TTL)
      const lockRes = await bookingService.createSeatLock(showId, seatNumbers);
      const { lockToken, lockId, expiresAt } = lockRes.data;

      setLockToken(lockToken);
      setLockId(lockId);
      setLockExpiresAt(expiresAt);

      // 2. Create pending booking record
      const bookingRes = await bookingService.createBooking(showId, lockToken);
      setPendingBooking(bookingRes.data.booking);

      toast.success('Seats locked for 5 minutes! Proceeding to payment...');
      navigate(`/payment?bookingId=${bookingRes.data.booking._id}`);
    } catch (err) {
      console.error('Reservation error:', err);
      toast.error(err.message || 'Seat lock could not be acquired');
      fetchSeatData();
    } finally {
      setLocking(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Preparing cinema auditorium seats..." />;
  }

  if (!show) {
    return (
      <div className="container py-5 text-center text-white">
        <h3 className="mb-2">Show Not Found</h3>
        <p className="text-muted">The requested cinema screening could not be located or has concluded.</p>
        <Link to="/movies" className="btn btn-cinema mt-3">
          Explore Current Movies
        </Link>
      </div>
    );
  }

  const movie = show?.movieId || {};
  const theatre = show?.theatreId || {};
  const screen = show?.screenId || {};

  // Format Show Date (e.g. "Mon \n 19 Oct")
  const dateObj = show.showDate ? new Date(show.showDate) : new Date();
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const dayAndMonth = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  // Sound/Screen format label
  const soundFormat = screen.name?.includes('Laser')
    ? '2K LASER DO...'
    : screen.name?.includes('Atmos')
    ? 'DOLBY ATMOS'
    : screen.name?.includes('IMAX')
    ? 'IMAX 3D'
    : '2K DIGITAL';

  return (
    <div className="cinema-auditorium-page">
      {/* 1. MOVIE HEADER matching Section 4 & Image 2 */}
      <header className="cinema-top-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline-secondary p-1 rounded-circle d-flex align-items-center justify-content-center text-light border-0"
            style={{ width: '34px', height: '34px', backgroundColor: 'rgba(255,255,255,0.05)' }}
            title="Back"
            aria-label="Back to show selection"
          >
            <FiArrowLeft size={19} />
          </button>
          <div>
            <h1 className="h6 fw-bold mb-0 text-white" style={{ fontSize: '1.05rem', letterSpacing: '0.2px' }}>
              {movie.title || 'Movie'}
            </h1>
            <div style={{ fontSize: '0.8rem', color: '#9E9EA8' }}>
              {theatre.name || 'Cinema'} {theatre.location ? `, ${theatre.location}` : theatre.city ? `, ${theatre.city}` : ''}
            </div>
          </div>
        </div>

        {/* Share Seat Map Action matching Image 2 vertical icon + label */}
        <button
          onClick={handleShareSeatMap}
          className="btn btn-sm d-flex flex-column align-items-center justify-content-center text-muted px-1 py-1"
          style={{ backgroundColor: 'transparent', border: 'none', color: '#9E9EA8' }}
          title="Share seat map link"
        >
          <FiShare2 size={18} />
          <span style={{ fontSize: '0.68rem', marginTop: '2px', lineHeight: 1.1 }}>Share seat map</span>
        </button>
      </header>

      {/* 2. SHOWTIME SELECTOR matching Section 5 & Image 2 */}
      <div className="cinema-showtime-strip d-flex align-items-center gap-3">
        {/* Selected Date Box */}
        <div className="cinema-date-tag">
          <div style={{ fontSize: '0.68rem', color: '#9E9EA8', textTransform: 'uppercase', fontWeight: '600' }}>
            {dayName}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#FFFFFF', fontWeight: '700' }}>
            {dayAndMonth}
          </div>
        </div>

        {/* Horizontally Scrollable Timing Buttons */}
        <div className="d-flex align-items-center gap-2 overflow-auto" style={{ scrollbarWidth: 'none' }}>
          {siblingShows.length > 0 ? (
            siblingShows.map((s) => {
              const isActive = s._id === showId;
              const pillSound = s.screenId?.name?.includes('Laser')
                ? '2K LASER DO...'
                : s.screenId?.name?.includes('Atmos')
                ? 'DOLBY ATMOS'
                : '2K DIGITAL';

              return (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => {
                    if (!isActive) {
                      navigate(`/seat-selection?showId=${s._id}`);
                    }
                  }}
                  className={`cinema-showtime-pill ${isActive ? 'active' : ''}`}
                >
                  <div className="fw-bold" style={{ fontSize: '0.85rem' }}>
                    {s.startTime}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: isActive ? '#C4B5FD' : '#64748B' }}>
                    {pillSound}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="cinema-showtime-pill active">
              <div className="fw-bold" style={{ fontSize: '0.85rem' }}>
                {show.startTime}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#C4B5FD' }}>
                {soundFormat}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. SEAT MAP AUDITORIUM (Cinepolis Geometry, descending rows & numbers) */}
      <main className="container-fluid px-1 px-md-3 py-2">
        <SeatMap
          show={show}
          seats={seatData?.seats || []}
          selectedSeats={selectedSeats}
          onSeatToggle={handleSeatToggle}
        />
      </main>

      {/* 4. FIXED BOTTOM BOOKING PANEL matching Section 12 & Image 2 */}
      <footer className="cinema-fixed-bottom-bar">
        {/* Partner Offers Strip matching Image 2 */}
        <div
          className="cinema-offers-bar"
          onClick={() => setShowOffersModal(true)}
          title="Click to view all 40 bank and payment offers"
        >
          <div className="bank-logos-group">
            {/* Visa */}
            <span
              className="bank-logo-circle"
              style={{ backgroundColor: '#1434CB', color: '#FFFFFF' }}
            >
              VISA
            </span>
            {/* Axis */}
            <span
              className="bank-logo-circle"
              style={{ backgroundColor: '#97144D', color: '#FFFFFF' }}
            >
              ▲
            </span>
            {/* Mastercard */}
            <span
              className="bank-logo-circle"
              style={{ backgroundColor: '#1A1A1A' }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EB001B', display: 'inline-block' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F79E1B', display: 'inline-block', marginLeft: '-3px', opacity: 0.85 }} />
              </span>
            </span>
            {/* Checkmark / RuPay */}
            <span
              className="bank-logo-circle"
              style={{ backgroundColor: '#0284C7', color: '#FFFFFF' }}
            >
              ✓
            </span>
          </div>
          <span className="cinema-offers-text">
            {appliedOffer ? (
              <span className="text-warning fw-bold">
                {appliedOffer.code} Applied <FiChevronRight size={14} />
              </span>
            ) : (
              <>
                40 offers <FiChevronRight size={14} style={{ color: '#9E9EA8' }} />
              </>
            )}
          </span>
        </div>

        {/* Selected Seats count, Price, and Proceed Button */}
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div style={{ fontSize: '0.68rem', color: '#9E9EA8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>
              Selected
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <span className="fw-bold text-white" style={{ fontSize: '1.05rem' }}>
                {selectedSeats.length === 0 ? '0 Seats' : `${selectedSeats.length} ${selectedSeats.length === 1 ? 'Seat' : 'Seats'}`}
              </span>
              {selectedSeats.length > 0 && (
                <span
                  className="cursor-pointer text-decoration-none"
                  style={{ fontSize: '0.88rem', color: '#A5B4FC', fontWeight: '600' }}
                  onClick={() => setShowBreakdownModal(true)}
                  title="Click to view pricing breakdown"
                >
                  ₹{totalAmount} <FiInfo size={12} className="text-muted ms-1" />
                </span>
              )}
            </div>
            {selectedSeats.length > 0 && (
              <div className="text-muted text-truncate" style={{ fontSize: '0.68rem', maxWidth: '200px' }}>
                {selectedSeats.map((s) => s.seatNumber).join(', ')}
              </div>
            )}
          </div>

          {/* High-Contrast Prominent Proceed Button matching Image 2 */}
          <button
            onClick={handleProceedToPayment}
            disabled={selectedSeats.length === 0 || locking}
            className="btn btn-proceed-white"
          >
            {locking ? 'Locking...' : 'Proceed'}
          </button>
        </div>
      </footer>

      {/* 5. PRICE BREAKDOWN MODAL */}
      {showBreakdownModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1100, backdropFilter: 'blur(4px)' }}
          onClick={() => setShowBreakdownModal(false)}
        >
          <div
            className="cinema-card p-4 mx-3"
            style={{ maxWidth: '420px', width: '100%', backgroundColor: '#161619', border: '1px solid #282830' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 text-white fw-bold" style={{ fontSize: '1.05rem' }}>Pricing Breakdown</h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary p-1 rounded-circle"
                style={{ width: '28px', height: '28px' }}
                onClick={() => setShowBreakdownModal(false)}
              >
                <FiX size={15} />
              </button>
            </div>

            {/* Selected Seats Chips */}
            <div className="mb-3">
              <div className="text-muted small mb-1" style={{ fontSize: '0.78rem' }}>
                Selected Seats ({selectedSeats.length}):
              </div>
              <div className="d-flex flex-wrap gap-1">
                {selectedSeats.map((s) => (
                  <span
                    key={s.seatNumber}
                    className="badge"
                    style={{ backgroundColor: '#6B5CF6', fontSize: '0.78rem' }}
                  >
                    {s.seatNumber} (₹{s.price})
                  </span>
                ))}
              </div>
            </div>

            <div className="border-top border-secondary pt-3 d-flex flex-column gap-2 small">
              <div className="d-flex justify-content-between text-muted">
                <span>Tickets Subtotal:</span>
                <span className="text-light">₹{subtotal}</span>
              </div>
              <div className="d-flex justify-content-between text-muted">
                <span>GST (18%):</span>
                <span className="text-light">₹{taxes}</span>
              </div>
              <div className="d-flex justify-content-between text-muted">
                <span>Convenience Fee:</span>
                <span className="text-light">₹{fees}</span>
              </div>
              <div
                className="d-flex justify-content-between fw-bold fs-5 border-top border-secondary pt-2 mt-2"
                style={{ color: '#F1F5F9' }}
              >
                <span>Total Payable:</span>
                <span style={{ color: '#8E80FC' }}>₹{totalAmount}</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                className="btn btn-cinema w-100 py-2"
                onClick={() => {
                  setShowBreakdownModal(false);
                  handleProceedToPayment();
                }}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. PARTNER OFFERS MODAL (40 Available Offers) */}
      {showOffersModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1100, backdropFilter: 'blur(4px)' }}
          onClick={() => setShowOffersModal(false)}
        >
          <div
            className="cinema-card p-4 mx-3"
            style={{ maxWidth: '440px', width: '100%', backgroundColor: '#141417', border: '1px solid #282830', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-0 text-white fw-bold" style={{ fontSize: '1.05rem' }}>
                  Available Payment Offers (40)
                </h5>
                <span style={{ fontSize: '0.75rem', color: '#9E9EA8' }}>
                  Select an offer to apply instant discount at checkout
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary p-1 rounded-circle"
                style={{ width: '28px', height: '28px' }}
                onClick={() => setShowOffersModal(false)}
              >
                <FiX size={15} />
              </button>
            </div>

            <div className="d-flex flex-column gap-3 mt-3">
              {PARTNER_OFFERS.map((offer) => {
                const isSelectedOffer = appliedOffer?.id === offer.id;

                return (
                  <div
                    key={offer.id}
                    className="p-3 rounded"
                    style={{
                      backgroundColor: isSelectedOffer ? 'rgba(107, 92, 246, 0.12)' : '#1B1B20',
                      border: isSelectedOffer ? '1.5px solid #6B5CF6' : '1px solid #2A2A33',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="badge" style={{ backgroundColor: '#2C2C38', color: '#C4B5FD', fontSize: '0.68rem' }}>
                        {offer.bank}
                      </span>
                      <span className="badge" style={{ backgroundColor: '#10B981', color: '#FFFFFF', fontSize: '0.65rem' }}>
                        {offer.badge}
                      </span>
                    </div>
                    <div className="fw-bold text-white mb-1" style={{ fontSize: '0.88rem' }}>
                      {offer.title}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#9E9EA8' }} className="mb-2">
                      {offer.discount}
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary">
                      <code className="text-warning fw-bold px-2 py-1 rounded" style={{ backgroundColor: '#26262F', fontSize: '0.78rem' }}>
                        {offer.code}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleApplyOffer(offer)}
                        className={`btn btn-sm px-3 ${isSelectedOffer ? 'btn-success' : 'btn-outline-light'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {isSelectedOffer ? (
                          <>
                            <FiCheck size={13} className="me-1" /> Applied
                          </>
                        ) : (
                          'Apply Offer'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-3 pt-2 text-muted" style={{ fontSize: '0.72rem' }}>
              + 35 more bank & wallet offers available during final payment
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default SeatSelection;
