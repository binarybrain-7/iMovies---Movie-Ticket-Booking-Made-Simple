import React, { useState, useEffect } from 'react';
import { screenService } from '../../services/screenService';
import { theatreService } from '../../services/theatreService';
import { toast } from 'react-toastify';
import { FiX, FiMonitor, FiDollarSign, FiCheck, FiUsers } from 'react-icons/fi';
import { FaTheaterMasks } from 'react-icons/fa';

const EditScreenModal = ({ isOpen, screen, defaultTheatreId, onClose, onSaved }) => {
  const [theatres, setTheatres] = useState([]);
  const [theatreId, setTheatreId] = useState('');
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Seat categories
  const [balconyCount, setBalconyCount] = useState(30);
  const [balconyPrice, setBalconyPrice] = useState(250);
  const [middleCount, setMiddleCount] = useState(50);
  const [middlePrice, setMiddlePrice] = useState(180);
  const [lowerCount, setLowerCount] = useState(40);
  const [lowerPrice, setLowerPrice] = useState(120);

  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(screen && screen._id);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchTheatres = async () => {
      try {
        const res = await theatreService.getTheatres({ activeOnly: 'false' });
        if (isMounted) {
          const list = res.data.theatres || [];
          setTheatres(list);
        }
      } catch (e) {
        console.error('Failed to load theatres for screen modal:', e);
      }
    };
    fetchTheatres();

    if (screen) {
      setName(screen.name || '');
      setTheatreId(screen.theatreId?._id || screen.theatreId || defaultTheatreId || '');
      setIsActive(screen.isActive !== false);

      const sc = screen.seatCategories || {};
      setBalconyCount(sc.balcony?.count ?? 30);
      setBalconyPrice(sc.balcony?.price ?? 250);
      setMiddleCount(sc.middle?.count ?? 50);
      setMiddlePrice(sc.middle?.price ?? 180);
      setLowerCount(sc.lower?.count ?? 40);
      setLowerPrice(sc.lower?.price ?? 120);
    } else {
      setName('');
      setTheatreId(defaultTheatreId || '');
      setIsActive(true);
      setBalconyCount(30);
      setBalconyPrice(250);
      setMiddleCount(50);
      setMiddlePrice(180);
      setLowerCount(40);
      setLowerPrice(120);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, screen, defaultTheatreId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!theatreId) {
      toast.error('Please select an associated theatre');
      return;
    }

    if (!name.trim()) {
      toast.error('Screen name is required');
      return;
    }

    try {
      setSubmitting(true);

      const seatCategories = {
        balcony: { count: Number(balconyCount) || 0, price: Number(balconyPrice) || 0 },
        middle: { count: Number(middleCount) || 0, price: Number(middlePrice) || 0 },
        lower: { count: Number(lowerCount) || 0, price: Number(lowerPrice) || 0 },
      };

      const payload = {
        theatreId,
        name: name.trim(),
        seatCategories,
        isActive,
      };

      let result;
      if (isEditing) {
        const res = await screenService.updateScreen(screen._id, payload);
        result = res.data?.screen || res.screen;
        toast.success(`Screen "${name}" updated successfully!`);
      } else {
        const res = await screenService.createScreen(theatreId, payload);
        result = res.data?.screen || res.screen;
        toast.success(`Screen "${name}" created successfully!`);
      }

      if (onSaved) {
        onSaved(result);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save screen:', err);
      toast.error(err.message || 'Failed to save screen configuration');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalSeats = Number(balconyCount) + Number(middleCount) + Number(lowerCount);

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
          maxWidth: '600px',
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
          <h4 className="modal-title mb-0 text-light fw-bold d-flex align-items-center gap-2">
            <FiMonitor className="text-info" /> {isEditing ? 'Edit' : 'Add'} <span className="text-danger">Screen</span>
          </h4>
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

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Theatre Selector */}
            <div className="col-12 text-start">
              <label className="cinema-label d-flex align-items-center gap-1">
                <FaTheaterMasks size={14} className="text-warning" /> Associated Theatre *
              </label>
              <select
                className="form-select cinema-select"
                value={theatreId}
                onChange={(e) => setTheatreId(e.target.value)}
                required
              >
                <option value="">Select Theatre</option>
                {theatres.map((th) => (
                  <option key={th._id} value={th._id}>
                    {th.name} ({th.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Screen Name */}
            <div className="col-12 col-md-8 text-start">
              <label className="cinema-label">Screen Name / Audi *</label>
              <input
                type="text"
                placeholder="e.g. Audi 1 (Dolby Atmos) or Screen 2"
                className="form-control cinema-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Status */}
            <div className="col-12 col-md-4 text-start">
              <label className="cinema-label">Status</label>
              <select
                className="form-select cinema-select"
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Total Seats indicator */}
            <div className="col-12">
              <div
                className="p-2 rounded d-flex justify-content-between align-items-center"
                style={{ backgroundColor: '#0B0F17', border: '1px solid #1F2937' }}
              >
                <span className="small text-muted d-flex align-items-center gap-1">
                  <FiUsers className="text-danger" /> Calculated Total Capacity:
                </span>
                <strong className="text-white">{totalSeats} Seats</strong>
              </div>
            </div>

            {/* Balcony Row */}
            <div className="col-6 text-start">
              <label className="cinema-label small">Balcony Seats Count</label>
              <input
                type="number"
                min="0"
                className="form-control cinema-input"
                value={balconyCount}
                onChange={(e) => setBalconyCount(e.target.value)}
                required
              />
            </div>
            <div className="col-6 text-start">
              <label className="cinema-label small">Balcony Seat Price (₹)</label>
              <input
                type="number"
                min="0"
                className="form-control cinema-input"
                value={balconyPrice}
                onChange={(e) => setBalconyPrice(e.target.value)}
                required
              />
            </div>

            {/* Middle Row */}
            <div className="col-6 text-start">
              <label className="cinema-label small">Middle Seats Count</label>
              <input
                type="number"
                min="0"
                className="form-control cinema-input"
                value={middleCount}
                onChange={(e) => setMiddleCount(e.target.value)}
                required
              />
            </div>
            <div className="col-6 text-start">
              <label className="cinema-label small">Middle Seat Price (₹)</label>
              <input
                type="number"
                min="0"
                className="form-control cinema-input"
                value={middlePrice}
                onChange={(e) => setMiddlePrice(e.target.value)}
                required
              />
            </div>

            {/* Lower Row */}
            <div className="col-6 text-start">
              <label className="cinema-label small">Lower Seats Count</label>
              <input
                type="number"
                min="0"
                className="form-control cinema-input"
                value={lowerCount}
                onChange={(e) => setLowerCount(e.target.value)}
                required
              />
            </div>
            <div className="col-6 text-start">
              <label className="cinema-label small">Lower Seat Price (₹)</label>
              <input
                type="number"
                min="0"
                className="form-control cinema-input"
                value={lowerPrice}
                onChange={(e) => setLowerPrice(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top" style={{ borderColor: 'var(--color-border)' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm px-3"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-cinema btn-sm px-4 d-flex align-items-center gap-1"
              disabled={submitting}
            >
              <FiCheck size={16} />
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Screen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditScreenModal;
