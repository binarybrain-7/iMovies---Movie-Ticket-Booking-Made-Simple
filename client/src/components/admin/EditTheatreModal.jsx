import React, { useState, useEffect } from 'react';
import { theatreService } from '../../services/theatreService';
import { toast } from 'react-toastify';
import { FiX, FiMapPin, FiCheck } from 'react-icons/fi';
import { FaTheaterMasks } from 'react-icons/fa';

const EditTheatreModal = ({ isOpen, theatre, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !theatre) return;

    setName(theatre.name || '');
    setLocation(theatre.location || '');
    setAddress(theatre.address || '');
    setCity(theatre.city || '');
    setState(theatre.state || '');
    setPostalCode(theatre.postalCode || '');
    setIsActive(theatre.isActive !== false);
  }, [isOpen, theatre]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !location.trim()) {
      toast.error('Theatre name and location are required');
      return;
    }

    try {
      setSubmitting(true);

      const resolvedCity = city.trim() || location.split(',')[0].trim();

      const payload = {
        name: name.trim(),
        location: location.trim(),
        address: address.trim(),
        city: resolvedCity,
        state: state.trim(),
        postalCode: postalCode.trim(),
        isActive,
      };

      const res = await theatreService.updateTheatre(theatre._id, payload);
      const updated = res.data?.theatre || res.theatre;

      toast.success(`Theatre "${name}" updated successfully!`);
      if (onSaved) {
        onSaved(updated);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update theatre:', err);
      toast.error(err.message || 'Failed to update theatre details');
    } finally {
      setSubmitting(false);
    }
  };

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
            <FaTheaterMasks className="text-warning" /> Edit <span className="text-danger">Theatre</span>
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
            {/* Theatre Name */}
            <div className="col-12 text-start">
              <label className="cinema-label">Theatre / Venue Name *</label>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="e.g. Cinepolis Bansal Plaza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Location */}
            <div className="col-12 col-md-6 text-start">
              <label className="cinema-label">Location (Area/Landmark) *</label>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="e.g. Bansal Plaza, Bhopal"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            {/* City */}
            <div className="col-12 col-md-6 text-start">
              <label className="cinema-label">City *</label>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="e.g. Bhopal"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>

            {/* Address */}
            <div className="col-12 text-start">
              <label className="cinema-label">Full Street Address</label>
              <textarea
                rows="2"
                className="form-control cinema-input"
                placeholder="Detailed venue address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* State */}
            <div className="col-6 text-start">
              <label className="cinema-label">State</label>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="e.g. Madhya Pradesh"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>

            {/* Postal Code */}
            <div className="col-6 text-start">
              <label className="cinema-label">Postal Code / Pincode</label>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="e.g. 462001"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>

            {/* Active Status Toggle */}
            <div className="col-12 text-start pt-2">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="theatreActiveSwitch"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label className="form-check-label text-light fw-medium small" htmlFor="theatreActiveSwitch">
                  Theatre is active and open for bookings
                </label>
              </div>
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
              {submitting ? 'Saving...' : 'Save Theatre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTheatreModal;
