import React, { useEffect, useState } from 'react';
import { screenService } from '../../services/screenService';
import { FiX, FiMonitor, FiDollarSign, FiUsers, FiEdit2, FiCalendar } from 'react-icons/fi';
import { FaTheaterMasks } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ScreenDetailsModal = ({ isOpen, screen, onClose, onOpenEdit }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !screen) return;

    let isMounted = true;
    const fetchScreen = async () => {
      try {
        setLoading(true);
        const res = await screenService.getScreenById(screen._id);
        if (isMounted) {
          setDetails(res.data);
        }
      } catch (err) {
        console.error('Failed to load screen details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchScreen();
    return () => {
      isMounted = false;
    };
  }, [isOpen, screen]);

  if (!isOpen || !screen) return null;

  const currentScreen = details?.screen || screen;
  const theatre = currentScreen.theatreId || {};
  const activeShowsCount = details?.activeShowsCount;
  const cats = currentScreen.seatCategories || {};

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1055,
        backdropFilter: 'blur(5px)',
      }}
      onClick={onClose}
    >
      <div
        className="cinema-card p-4 mx-3 shadow-2xl"
        style={{
          maxWidth: '580px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#111827',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--color-border)' }}>
          <div className="d-flex align-items-center gap-2">
            <FiMonitor className="text-info" size={20} />
            <h4 className="modal-title mb-0 text-light fw-bold">
              {currentScreen.name}
            </h4>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-1 rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '28px', height: '28px' }}
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="text-start">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className={`badge ${currentScreen.isActive ? 'bg-success' : 'bg-secondary'}`}>
              {currentScreen.isActive ? 'Active Screen' : 'Inactive Screen'}
            </span>
            {activeShowsCount !== undefined && (
              <span className="badge bg-dark border text-light">
                {activeShowsCount} active show(s) scheduled
              </span>
            )}
          </div>

          {/* Theatre info box */}
          <div className="p-3 rounded mb-3" style={{ backgroundColor: '#0B0F17', border: '1px solid #1F2937' }}>
            <div className="d-flex align-items-center gap-2 small text-light mb-1">
              <FaTheaterMasks className="text-warning flex-shrink-0" />
              <strong>Theatre: </strong> {theatre.name || 'Venue'}
            </div>
            <div className="small text-muted ps-4">
              {theatre.location || theatre.address} ({theatre.city})
            </div>
          </div>

          {/* Capacity summary */}
          <div
            className="p-3 rounded mb-3 d-flex justify-content-between align-items-center"
            style={{ backgroundColor: '#1F2937' }}
          >
            <span className="text-light d-flex align-items-center gap-2">
              <FiUsers className="text-danger" /> Total Seating Capacity
            </span>
            <h4 className="text-white fw-bold mb-0">{currentScreen.totalSeats || 120}</h4>
          </div>

          {/* Seat Categories Breakdown */}
          <div className="mb-3">
            <h6 className="text-light small fw-bold mb-2 d-flex align-items-center gap-1">
              <FiDollarSign className="text-success" /> Seating Categories & Default Pricing
            </h6>
            <div className="row g-2">
              <div className="col-4">
                <div className="p-2 rounded text-center border" style={{ backgroundColor: '#0B0F17', borderColor: 'var(--color-border)' }}>
                  <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Balcony</div>
                  <strong className="text-light">{cats.balcony?.count ?? 30} seats</strong>
                  <div className="text-success small fw-bold">₹{cats.balcony?.price ?? 250}</div>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded text-center border" style={{ backgroundColor: '#0B0F17', borderColor: 'var(--color-border)' }}>
                  <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Middle</div>
                  <strong className="text-light">{cats.middle?.count ?? 50} seats</strong>
                  <div className="text-success small fw-bold">₹{cats.middle?.price ?? 180}</div>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded text-center border" style={{ backgroundColor: '#0B0F17', borderColor: 'var(--color-border)' }}>
                  <div className="text-muted small" style={{ fontSize: '0.75rem' }}>Lower</div>
                  <strong className="text-light">{cats.lower?.count ?? 40} seats</strong>
                  <div className="text-success small fw-bold">₹{cats.lower?.price ?? 120}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top" style={{ borderColor: 'var(--color-border)' }}>
          <button type="button" className="btn btn-secondary btn-sm px-3" onClick={onClose}>
            Close
          </button>
          <Link
            to="/admin/add-show"
            className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1"
          >
            <FiCalendar size={14} /> Schedule Show
          </Link>
          {onOpenEdit && (
            <button
              type="button"
              className="btn btn-cinema btn-sm px-4 d-flex align-items-center gap-1"
              onClick={() => {
                onClose();
                onOpenEdit(currentScreen);
              }}
            >
              <FiEdit2 size={15} /> Edit This Screen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenDetailsModal;
