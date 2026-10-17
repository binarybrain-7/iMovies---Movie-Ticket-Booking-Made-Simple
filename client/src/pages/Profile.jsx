import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiPhone, FiLock, FiClock, FiHeart, FiStar, FiLogOut } from 'react-icons/fi';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ bookings: 0, favorites: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await authService.getMe();
        if (res.data?.user) {
          updateUser(res.data.user);
          setUsername(res.data.user.username);
          setPhone(res.data.user.phone || '');
        }

        // Fetch stats from users/me
        const profileRes = await authService.updateProfile({}); // reads profile
        if (profileRes.data?.stats) {
          setStats(profileRes.data.stats);
        }
      } catch (err) {
        console.error('Error fetching profile stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await authService.updateProfile({ username, phone });
      updateUser(res.data.user);
      toast.success('Profile details updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      await authService.changePassword({ currentPassword, newPassword, confirmNewPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return <LoadingSpinner message="Loading your account profile..." />;
  }

  return (
    <div className="profile-page container py-4" style={{ maxWidth: '850px' }}>
      <h1 className="h3 fw-bold mb-4" style={{ color: 'var(--color-text)' }}>
        Account <span style={{ color: 'var(--color-primary)' }}>Profile</span>
      </h1>

      {/* Profile Overview Card */}
      <div className="cinema-card p-4 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-3"
              style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-primary)' }}
            >
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h4 className="fw-bold mb-1">{user?.username}</h4>
              <div className="text-muted small d-flex align-items-center gap-2">
                <span>{user?.email}</span>
                <span className="badge bg-secondary">{user?.role}</span>
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className="btn btn-cinema-danger d-flex align-items-center gap-2">
            <FiLogOut /> Sign Out
          </button>
        </div>

        {/* Quick Links & Stats */}
        <div className="row g-3 mt-4 pt-3 border-top" style={{ borderColor: 'var(--color-border)' }}>
          <div className="col-4 text-center">
            <Link to="/my-bookings" className="text-decoration-none">
              <div className="cinema-card p-2 cinema-card-interactive">
                <FiClock className="text-danger mb-1" size={20} />
                <div className="small text-muted">My Bookings</div>
                <div className="fw-bold fs-5 text-white">{stats.bookings || 0}</div>
              </div>
            </Link>
          </div>

          <div className="col-4 text-center">
            <Link to="/favorites" className="text-decoration-none">
              <div className="cinema-card p-2 cinema-card-interactive">
                <FiHeart className="text-danger mb-1" size={20} />
                <div className="small text-muted">Favorites</div>
                <div className="fw-bold fs-5 text-white">{stats.favorites || 0}</div>
              </div>
            </Link>
          </div>

          <div className="col-4 text-center">
            <div className="cinema-card p-2">
              <FiStar className="text-warning mb-1" size={20} />
              <div className="small text-muted">Reviews</div>
              <div className="fw-bold fs-5 text-white">{stats.reviews || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Edit Profile Form */}
        <div className="col-12 col-md-6">
          <div className="cinema-card p-4 h-100">
            <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ borderColor: 'var(--color-border)' }}>
              Personal Information
            </h5>

            <form onSubmit={handleUpdateProfile}>
              <div className="mb-3">
                <label className="cinema-label">Username</label>
                <div className="input-group">
                  <span className="input-group-text cinema-input">
                    <FiUser />
                  </span>
                  <input
                    type="text"
                    className="form-control cinema-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="cinema-label">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text cinema-input">
                    <FiMail />
                  </span>
                  <input
                    type="email"
                    className="form-control cinema-input"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
                <small className="text-muted">Email address cannot be changed.</small>
              </div>

              <div className="mb-4">
                <label className="cinema-label">Phone Number</label>
                <div className="input-group">
                  <span className="input-group-text cinema-input">
                    <FiPhone />
                  </span>
                  <input
                    type="tel"
                    className="form-control cinema-input"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="btn btn-cinema w-100"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="col-12 col-md-6">
          <div className="cinema-card p-4 h-100">
            <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ borderColor: 'var(--color-border)' }}>
              Security & Password
            </h5>

            <form onSubmit={handleChangePassword}>
              <div className="mb-3">
                <label className="cinema-label">Current Password</label>
                <div className="input-group">
                  <span className="input-group-text cinema-input">
                    <FiLock />
                  </span>
                  <input
                    type="password"
                    className="form-control cinema-input"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="cinema-label">New Password</label>
                <div className="input-group">
                  <span className="input-group-text cinema-input">
                    <FiLock />
                  </span>
                  <input
                    type="password"
                    className="form-control cinema-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="cinema-label">Confirm New Password</label>
                <div className="input-group">
                  <span className="input-group-text cinema-input">
                    <FiLock />
                  </span>
                  <input
                    type="password"
                    className="form-control cinema-input"
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="btn btn-cinema-secondary w-100"
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
