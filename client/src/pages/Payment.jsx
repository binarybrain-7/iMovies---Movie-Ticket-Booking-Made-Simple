import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import {
  FiClock,
  FiShield,
  FiCreditCard,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
} from 'react-icons/fi';

const Payment = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(300); // 5 minutes default
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      navigate('/movies');
      return;
    }

    const initPayment = async () => {
      try {
        setLoading(true);
        // 1. Fetch booking details
        const bRes = await bookingService.getBookingById(bookingId);
        const b = bRes.data.booking;
        setBooking(b);

        if (b.status === 'CONFIRMED') {
          toast.info('This booking is already paid and confirmed!');
          navigate(`/booking-confirmation/${bookingId}`);
          return;
        }

        // Calculate countdown timer based on reservation expiration
        if (b.reservationExpiresAt) {
          const diff = Math.max(0, Math.floor((new Date(b.reservationExpiresAt) - new Date()) / 1000));
          setTimeLeftSeconds(diff);
          if (diff <= 0) setIsExpired(true);
        }

        // 2. Create payment order on the backend
        const orderRes = await paymentService.createOrder(bookingId);
        setOrderData(orderRes.data);
      } catch (err) {
        console.error('Payment initialization error:', err);
        toast.error(err.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    initPayment();
  }, [bookingId]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeftSeconds <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  // Handle Sandbox or Razorpay Verification
  const handleVerify = async (resultType = 'success') => {
    if (isExpired) {
      toast.error('Seat reservation has expired! Please select seats again.');
      return;
    }

    try {
      setProcessing(true);

      const verificationPayload = {
        bookingId: booking._id,
        orderId: orderData.orderId,
        simulationResult: resultType,
      };

      const res = await paymentService.verifyPayment(verificationPayload);

      if (res.data?.verified) {
        toast.success('Payment successfully processed & verified!');
        navigate(`/booking-confirmation/${booking._id}`);
      } else {
        toast.error('Payment verification failed as requested.');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      toast.error(err.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Securing payment gateway order..." />;
  }

  if (!booking) {
    return (
      <div className="container py-5 text-center">
        <h4>Booking not found</h4>
        <Link to="/movies" className="btn btn-cinema mt-3">
          Browse Movies
        </Link>
      </div>
    );
  }

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const show = booking.showId || {};
  const movie = show.movieId || {};
  const theatre = show.theatreId || {};

  return (
    <div className="payment-page container py-4" style={{ maxWidth: '780px' }}>
      {/* Reservation Expiration Timer Header */}
      <div
        className={`cinema-card p-3 mb-4 d-flex align-items-center justify-content-between ${
          isExpired ? 'border-danger' : 'border-warning'
        }`}
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="d-flex align-items-center gap-2">
          <FiClock className={isExpired ? 'text-danger' : 'text-warning'} size={20} />
          <div>
            <div className="fw-bold small">
              {isExpired ? 'Reservation Expired' : 'Temporary Seat Reservation Active'}
            </div>
            <div className="small text-muted">
              {isExpired
                ? 'Your 5-minute seat lock has lapsed. Please re-select seats.'
                : 'Seats are locked for you. Complete payment before the timer reaches 0.'}
            </div>
          </div>
        </div>

        <div
          className={`fs-4 fw-bold font-monospace ${
            isExpired ? 'text-danger' : 'text-warning'
          }`}
        >
          {formatTimer(timeLeftSeconds)}
        </div>
      </div>

      {isExpired ? (
        <div className="cinema-card text-center p-5">
          <FiAlertTriangle size={48} className="text-danger mb-3" />
          <h3 className="h4 fw-bold mb-2">Reservation Expired</h3>
          <p className="text-muted small mb-4">
            To ensure fair cinema booking, temporary seat locks are released after 5 minutes.
          </p>
          <button
            onClick={() => navigate(`/select-show?movieId=${movie._id}`)}
            className="btn btn-cinema"
          >
            Select Shows & Seats Again
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {/* Order Details Column */}
          <div className="col-12 col-md-6">
            <div className="cinema-card p-4 h-100">
              <h4 className="h5 fw-bold border-bottom pb-2 mb-3" style={{ borderColor: 'var(--color-border)' }}>
                Order Summary
              </h4>

              <div className="d-flex gap-3 mb-3">
                {movie.posterUrl && (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="rounded shadow"
                    style={{ width: '70px', height: '100px', objectFit: 'cover' }}
                  />
                )}
                <div>
                  <h5 className="fw-bold mb-1" style={{ fontSize: '1.05rem' }}>
                    {movie.title}
                  </h5>
                  <div className="small text-muted">{theatre.name}</div>
                  <div className="small text-muted">
                    {show.showDate} at <strong style={{ color: 'var(--color-primary)' }}>{show.startTime}</strong>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <span className="small text-muted d-block">Seats:</span>
                <strong>{booking.seats?.map((s) => s.seatNumber).join(', ')}</strong>
                <span className="small text-muted ms-2">({booking.seats?.length} tickets)</span>
              </div>

              <div className="border-top pt-2 small text-muted">
                <div className="d-flex justify-content-between mb-1">
                  <span>Tickets Subtotal:</span>
                  <span>₹{booking.subtotal}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>GST (18%):</span>
                  <span>₹{booking.taxes}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Convenience Fee:</span>
                  <span>₹{booking.fees}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold fs-5 text-white border-top pt-2">
                  <span>Amount to Pay:</span>
                  <span style={{ color: 'var(--color-primary)' }}>₹{booking.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method / Sandbox Checkout Column */}
          <div className="col-12 col-md-6">
            <div className="cinema-card p-4 h-100 d-flex flex-column">
              <h4 className="h5 fw-bold border-bottom pb-2 mb-3 d-flex align-items-center justify-content-between" style={{ borderColor: 'var(--color-border)' }}>
                <span>Payment Checkout</span>
                <span className="badge bg-secondary small" style={{ fontSize: '0.7rem' }}>
                  {orderData?.isSimulation ? 'SANDBOX SIMULATION' : 'LIVE GATEWAY'}
                </span>
              </h4>

              {/* Explicit development sandbox indicator */}
              <div
                className="p-3 mb-4 rounded border small"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                  color: '#F59E0B',
                }}
              >
                <div className="fw-bold mb-1 d-flex align-items-center gap-1">
                  <FiShield /> Development Mode Simulation
                </div>
                <div>
                  No real card details or external payment accounts are charged. This sandbox simulator verifies backend order creation, atomic seat locks, idempotency, and digital ticket issuance.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto d-flex flex-column gap-3">
                <button
                  onClick={() => handleVerify('success')}
                  disabled={processing || isExpired}
                  className="btn btn-cinema py-3 d-flex align-items-center justify-content-center gap-2 fw-bold"
                >
                  <FiCheckCircle size={18} />
                  {processing ? 'Confirming Ticket...' : `Pay ₹${booking.totalAmount} (Demo Success)`}
                </button>

                <button
                  onClick={() => handleVerify('fail')}
                  disabled={processing || isExpired}
                  className="btn btn-cinema-secondary py-2 d-flex align-items-center justify-content-center gap-2 text-danger"
                >
                  <FiXCircle size={16} /> Simulate Payment Failure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
