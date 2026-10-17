import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiDollarSign, FiTrendingUp, FiFilter, FiCalendar } from 'react-icons/fi';

const RevenueReports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await adminService.getRevenueReport(params);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load revenue report:', err);
      toast.error('Failed to load revenue analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchRevenue();
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchRevenue();
  };

  const summary = report?.summary || {};
  const breakdown = report?.movieBreakdown || [];

  return (
    <div className="admin-revenue-reports container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/admin" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Dashboard
        </Link>
      </div>

      <h1 className="section-title text-start mb-4">
        Financial <span className="text-accent">Revenue Reports</span>
      </h1>

      {/* Date Filter Card */}
      <div className="cinema-card p-3 mb-4">
        <form onSubmit={handleFilterSubmit} className="row g-3 align-items-end">
          <div className="col-12 col-sm-4">
            <label className="cinema-label">From Date</label>
            <input
              type="date"
              className="form-control cinema-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="col-12 col-sm-4">
            <label className="cinema-label">To Date</label>
            <input
              type="date"
              className="form-control cinema-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="col-12 col-sm-4 d-flex gap-2">
            <button type="submit" className="btn btn-cinema flex-grow-1">
              Apply Filter
            </button>
            <button type="button" onClick={handleClearFilter} className="btn btn-cinema-secondary">
              Reset
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner message="Calculating revenue telemetry..." />
      ) : (
        <>
          {/* Revenue KPI Cards */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="cinema-card p-3">
                <span className="small text-muted d-block mb-1">Gross Collections</span>
                <h3 className="fw-bold mb-0 text-white">₹{summary.grossRevenue || 0}</h3>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="cinema-card p-3">
                <span className="small text-muted d-block mb-1">Refunds Processed</span>
                <h3 className="fw-bold mb-0 text-danger">₹{summary.totalRefunds || 0}</h3>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="cinema-card p-3">
                <span className="small text-muted d-block mb-1">Net Realized Revenue</span>
                <h3 className="fw-bold mb-0 text-success">₹{summary.netRevenue || 0}</h3>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="cinema-card p-3">
                <span className="small text-muted d-block mb-1">Total Tickets Sold</span>
                <h3 className="fw-bold mb-0 text-info">{summary.totalTickets || 0}</h3>
              </div>
            </div>
          </div>

          {/* Movie Breakdown Table */}
          <div className="cinema-card p-0 overflow-hidden shadow">
            <div className="p-3 border-bottom" style={{ borderColor: 'var(--color-border)' }}>
              <h5 className="fw-bold mb-0">Collections Breakdown by Movie</h5>
            </div>

            {breakdown.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No verified payment collections in this timeframe.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover mb-0" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <thead>
                    <tr className="border-bottom" style={{ borderColor: 'var(--color-border)' }}>
                      <th className="p-3">Movie</th>
                      <th className="p-3">Bookings</th>
                      <th className="p-3">Tickets Sold</th>
                      <th className="p-3 text-end">Total Gross</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((item) => (
                      <tr key={item._id} className="border-bottom" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="p-3">
                          <div className="d-flex align-items-center gap-3">
                            {item.posterUrl && (
                              <img
                                src={item.posterUrl}
                                alt={item.movieTitle}
                                className="rounded"
                                style={{ width: '40px', height: '55px', objectFit: 'cover' }}
                              />
                            )}
                            <strong className="fs-6">{item.movieTitle}</strong>
                          </div>
                        </td>
                        <td className="p-3 text-muted">{item.bookingsCount}</td>
                        <td className="p-3 text-muted">{item.ticketsCount}</td>
                        <td className="p-3 text-end fw-bold text-success fs-6">
                          ₹{item.totalRevenue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueReports;
