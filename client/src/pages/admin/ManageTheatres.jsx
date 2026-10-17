import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { theatreService } from '../../services/theatreService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiPlus, FiArrowLeft, FiMapPin, FiTrash2 } from 'react-icons/fi';
import { FaTheaterMasks } from 'react-icons/fa';

const ManageTheatres = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTheatres = async () => {
    try {
      setLoading(true);
      const res = await theatreService.getTheatres({ activeOnly: 'false' });
      setTheatres(res.data.theatres || []);
    } catch (err) {
      console.error('Error fetching theatres:', err);
      toast.error('Failed to load theatres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  const handleDelete = async (theatreId, name) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate "${name}"?`)) return;

    try {
      await theatreService.deleteTheatre(theatreId);
      toast.success('Theatre status updated');
      fetchTheatres();
    } catch (err) {
      toast.error(err.message || 'Failed to delete theatre');
    }
  };

  return (
    <div className="admin-manage-theatres container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/admin" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <Link to="/admin/add-theatre" className="btn btn-cinema btn-sm d-flex align-items-center gap-1">
          <FiPlus /> Add Theatre
        </Link>
      </div>

      <h1 className="section-title text-start mb-4">
        Manage <span className="text-accent">Theatres</span>
      </h1>

      {loading ? (
        <LoadingSpinner message="Fetching cinema theatres..." />
      ) : theatres.length === 0 ? (
        <div className="cinema-card text-center py-5">
          <p className="text-muted">No theatres registered yet.</p>
          <Link to="/admin/add-theatre" className="btn btn-cinema btn-sm">
            Add Your First Theatre
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {theatres.map((th) => (
            <div key={th._id} className="col-12 col-md-6 col-lg-4">
              <div className="cinema-card p-3 h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <FaTheaterMasks className="text-danger" size={20} />
                    <h5 className="fw-bold mb-0">{th.name}</h5>
                  </div>
                  <span className={`badge ${th.isActive ? 'bg-success' : 'bg-secondary'}`}>
                    {th.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="small text-muted mb-2 d-flex align-items-center gap-1">
                  <FiMapPin size={13} /> {th.location} ({th.city})
                </div>

                {th.address && <div className="small text-muted mb-3">{th.address}</div>}

                <div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top" style={{ borderColor: 'var(--color-border)' }}>
                  <Link to={`/admin/add-show`} className="small text-danger text-decoration-none fw-bold">
                    + Schedule Show
                  </Link>

                  <button
                    onClick={() => handleDelete(th._id, th.name)}
                    className="btn btn-cinema-danger btn-sm p-1 px-2"
                    title="Deactivate Theatre"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageTheatres;
