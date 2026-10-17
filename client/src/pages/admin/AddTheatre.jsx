import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { theatreService } from '../../services/theatreService';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';

const AddTheatre = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [balconySeatPrice, setBalconySeatPrice] = useState(250);
  const [balconySeatCount, setBalconySeatCount] = useState(30);
  const [middleSeatPrice, setMiddleSeatPrice] = useState(180);
  const [middleSeatCount, setMiddleSeatCount] = useState(50);
  const [lowerSeatPrice, setLowerSeatPrice] = useState(120);
  const [lowerSeatCount, setLowerSeatCount] = useState(40);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) {
      toast.error('Theatre name and location are required');
      return;
    }

    try {
      setSubmitting(true);
      await theatreService.createTheatre({
        name: name.trim(),
        location: location.trim(),
        city: location.split(',')[0].trim(),
        balconySeatPrice: Number(balconySeatPrice),
        balconySeatCount: Number(balconySeatCount),
        middleSeatPrice: Number(middleSeatPrice),
        middleSeatCount: Number(middleSeatCount),
        lowerSeatPrice: Number(lowerSeatPrice),
        lowerSeatCount: Number(lowerSeatCount),
      });

      toast.success(`Theatre "${name}" created successfully!`);
      navigate('/admin/theatres');
    } catch (err) {
      toast.error(err.message || 'Failed to create theatre');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-add-theatre container py-4" style={{ maxWidth: '640px' }}>
      <div className="d-flex align-items-center gap-2 mb-4">
        <Link to="/admin" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Dashboard
        </Link>
      </div>

      {/* Title matching Screenshot 3: "Add Theatre" (Theatre in red) */}
      <h1 className="section-title mb-4">
        Add <span className="text-accent">Theatre</span>
      </h1>

      <div
        className="cinema-card p-4 p-md-5 shadow-lg"
        style={{
          backgroundColor: '#111827',
          border: '1px solid var(--color-border)',
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Theatre Name matching Screenshot 3 */}
          <div className="mb-3 text-start">
            <label className="cinema-label">Theatre Name</label>
            <input
              type="text"
              className="form-control cinema-input"
              placeholder="e.g. Srinivasa Theatre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Theatre Location matching Screenshot 3 */}
          <div className="mb-4 text-start">
            <label className="cinema-label">Theatre Location</label>
            <input
              type="text"
              className="form-control cinema-input"
              placeholder="e.g. RTC X Roads, Hyderabad"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          {/* Balcony Row */}
          <div className="row g-3 mb-3">
            <div className="col-6 text-start">
              <label className="cinema-label">Balcony Seat Price</label>
              <input
                type="number"
                className="form-control cinema-input"
                value={balconySeatPrice}
                onChange={(e) => setBalconySeatPrice(e.target.value)}
                min="0"
                required
              />
            </div>
            <div className="col-6 text-start">
              <label className="cinema-label">Balcony Seat Count</label>
              <input
                type="number"
                className="form-control cinema-input"
                value={balconySeatCount}
                onChange={(e) => setBalconySeatCount(e.target.value)}
                min="1"
                required
              />
            </div>
          </div>

          {/* Middle Row */}
          <div className="row g-3 mb-3">
            <div className="col-6 text-start">
              <label className="cinema-label">Middle Seat Price</label>
              <input
                type="number"
                className="form-control cinema-input"
                value={middleSeatPrice}
                onChange={(e) => setMiddleSeatPrice(e.target.value)}
                min="0"
                required
              />
            </div>
            <div className="col-6 text-start">
              <label className="cinema-label">Middle Seat Count</label>
              <input
                type="number"
                className="form-control cinema-input"
                value={middleSeatCount}
                onChange={(e) => setMiddleSeatCount(e.target.value)}
                min="1"
                required
              />
            </div>
          </div>

          {/* Lower Row */}
          <div className="row g-3 mb-4">
            <div className="col-6 text-start">
              <label className="cinema-label">Lower Seat Price</label>
              <input
                type="number"
                className="form-control cinema-input"
                value={lowerSeatPrice}
                onChange={(e) => setLowerSeatPrice(e.target.value)}
                min="0"
                required
              />
            </div>
            <div className="col-6 text-start">
              <label className="cinema-label">Lower Seat Count</label>
              <input
                type="number"
                className="form-control cinema-input"
                value={lowerSeatCount}
                onChange={(e) => setLowerSeatCount(e.target.value)}
                min="1"
                required
              />
            </div>
          </div>

          {/* Submit Button matching Screenshot 3 */}
          <div className="text-center">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-cinema px-5 py-2"
              style={{ fontWeight: '600' }}
            >
              {submitting ? 'Creating...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTheatre;
