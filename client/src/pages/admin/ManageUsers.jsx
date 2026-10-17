import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiSearch, FiUserCheck, FiUserX, FiShield } from 'react-icons/fi';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllUsers({ search });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await adminService.toggleUserStatus(userId, !currentStatus);
      toast.success('User status updated');
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: !currentStatus } : u))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="admin-manage-users container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/admin" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Dashboard
        </Link>
      </div>

      <h1 className="section-title text-start mb-4">
        User <span className="text-accent">Accounts</span>
      </h1>

      <div className="cinema-card p-3 mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchUsers();
          }}
          className="d-flex gap-2"
        >
          <input
            type="text"
            className="form-control cinema-input"
            placeholder="Search by username, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-cinema px-4">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner message="Retrieving registered user directory..." />
      ) : users.length === 0 ? (
        <div className="cinema-card text-center py-5">
          <p className="text-muted">No users found.</p>
        </div>
      ) : (
        <div className="cinema-card p-0 overflow-hidden shadow">
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ backgroundColor: 'var(--color-surface)' }}>
              <thead>
                <tr className="border-bottom" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-bottom" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-3 fw-bold">{u.username}</td>
                    <td className="p-3 text-muted">{u.email}</td>
                    <td className="p-3 text-muted">{u.phone || '—'}</td>
                    <td className="p-3">
                      <span className={`badge ${u.role === 'ADMIN' ? 'bg-danger' : 'bg-secondary'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`badge ${u.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-3 text-end">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleStatus(u._id, u.isActive)}
                          className={`btn btn-sm ${u.isActive ? 'btn-cinema-danger' : 'btn-success'}`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
