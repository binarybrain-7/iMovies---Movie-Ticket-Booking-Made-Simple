import React, { useEffect, useState } from 'react';
import { theatreService } from '../../services/theatreService';
import { screenService } from '../../services/screenService';
import { FiX, FiMapPin, FiEdit2, FiMonitor, FiPlus, FiCheckCircle } from 'react-icons/fi';
import { FaTheaterMasks } from 'react-icons/fa';

const TheatreDetailsModal = ({ isOpen, theatre, onClose, onOpenEdit, onAddScreen }) => {
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !theatre) return;

    let isMounted = true;
    const fetchScreens = async () => {
      try {
        setLoading(true);
        const res = await screenService.getScreensByTheatre(theatre._id, { activeOnly: 'false' });
        if (isMounted) {
          setScreens(res.data.screens || []);
        }
      } catch (err) {
        console.error('Failed to load theatre screens:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchScreens();
    return () => {
      isMounted = false;
    };
  }, [isOpen, theatre]);

  if (!isOpen || !theatre) return null;

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
          maxWidth: '650px',
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
            <FaTheaterMasks className="text-warning" size={20} />
            <h4 className="modal-title mb-0 text-light fw-bold">
              {theatre.name}
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

        {/* Status & Location Info */}
        <div className="mb-4 text-start">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className={`badge ${theatre.isActive ? 'bg-success' : 'bg-secondary'}`}>
              {theatre.isActive ? 'Active Venue' : 'Inactive / Closed'}
            </span>
            <span className="text-muted small">• {screens.length} Screen(s)</span>
          </div>

          <div className="p-3 rounded mb-3" style={{ backgroundColor: '#0B0F17', border: '1px solid #1F2937' }}>
            <div className="small text-light mb-1 d-flex align-items-center gap-2">
              <FiMapPin className="text-danger flex-shrink-0" />
              <strong>Location: </strong> {theatre.location}
            </div>
            {theatre.address && (
              <div className="small text-muted mb-1 ps-4">
                <strong>Address: </strong> {theatre.address}
              </div>
            )}
            <div className="small text-muted ps-4">
              <strong>City: </strong> {theatre.city} {theatre.state ? `, ${theatre.state}` : ''}{' '}
              {theatre.postalCode ? `- ${theatre.postalCode}` : ''}
            </div>
          </div>
        </div>

        {/* Screens Section */}
        <div className="text-start">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="text-light fw-bold mb-0 d-flex align-items-center gap-2">
              <FiMonitor className="text-info" /> Auditoriums / Screens ({screens.length})
            </h6>
            {onAddScreen && (
              <button
                type="button"
                className="btn btn-cinema btn-sm py-1 px-2 d-flex align-items-center gap-1"
                style={{ fontSize: '0.75rem' }}
                onClick={() => {
                  onClose();
                  onAddScreen(theatre);
                }}
              >
                <FiPlus /> Add Screen
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-4 text-muted small">Loading screens...</div>
          ) : screens.length === 0 ? (
            <div className="p-3 rounded text-center text-muted small" style={{ backgroundColor: '#0B0F17' }}>
              No screens configured for this theatre yet.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {screens.map((sc) => (
                <div
                  key={sc._id}
                  className="p-3 rounded d-flex justify-content-between align-items-center border"
                  style={{ backgroundColor: '#0B0F17', borderColor: 'var(--color-border)' }}
                >
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <strong className="text-light">{sc.name}</strong>
                      <span className={`badge ${sc.isActive ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.65rem' }}>
                        {sc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-muted small mt-1">
                      Capacity: <strong>{sc.totalSeats || 120}</strong> seats
                    </div>
                  </div>

                  <div className="text-end small">
                    {sc.seatCategories && (
                      <div className="text-muted">
                        Balcony: <span className="text-white">₹{sc.seatCategories.balcony?.price || 250}</span> •
                        Middle: <span className="text-white">₹{sc.seatCategories.middle?.price || 180}</span> •
                        Lower: <span className="text-white">₹{sc.seatCategories.lower?.price || 120}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top" style={{ borderColor: 'var(--color-border)' }}>
          <button type="button" className="btn btn-secondary btn-sm px-3" onClick={onClose}>
            Close
          </button>
          {onOpenEdit && (
            <button
              type="button"
              className="btn btn-cinema btn-sm px-4 d-flex align-items-center gap-1"
              onClick={() => {
                onClose();
                onOpenEdit(theatre);
              }}
            >
              <FiEdit2 size={15} /> Edit This Theatre
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TheatreDetailsModal;
