import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminRegister, setIsAdminRegister] = useState(false);
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        username,
        email,
        password,
        confirmPassword,
        phone,
      };

      if (isAdminRegister) {
        payload.role = 'ADMIN';
        payload.adminSecretKey = adminSecretKey;
      }

      const user = await register(payload);
      toast.success(`Account created successfully! Welcome, ${user.username}`);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="register-page d-flex align-items-center justify-content-center py-5 px-3"
      style={{
        minHeight: '85vh',
        backgroundColor: '#08090D',
      }}
    >
      <div
        className="cinema-card shadow-lg"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#111827',
          border: '1px solid #E50914',
          borderRadius: '12px',
          padding: '2.5rem 2rem',
        }}
      >
        {/* Header matching Screenshot 1 */}
        <div className="text-center mb-4">
          <div className="brand-logo mb-1" style={{ fontSize: '2rem' }}>
            <span className="brand-i">i</span>
            <span className="brand-movies">Movies</span>
          </div>
          <h2 className="h5 fw-bold" style={{ color: '#F9FAFB' }}>
            {isAdminRegister ? 'Admin Registration' : 'Register'}
          </h2>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div className="mb-3 text-start">
            <label className="cinema-label" htmlFor="regUsername">
              Username
            </label>
            <input
              id="regUsername"
              type="text"
              className="form-control cinema-input w-100"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Email Field */}
          <div className="mb-3 text-start">
            <label className="cinema-label" htmlFor="regEmail">
              Email
            </label>
            <input
              id="regEmail"
              type="email"
              className="form-control cinema-input w-100"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Field */}
          <div className="mb-3 text-start">
            <label className="cinema-label" htmlFor="regPassword">
              Password
            </label>
            <input
              id="regPassword"
              type={showPassword ? 'text' : 'password'}
              className="form-control cinema-input w-100"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm Password Field */}
          <div className="mb-3 text-start">
            <label className="cinema-label" htmlFor="regConfirmPassword">
              Confirm Password
            </label>
            <input
              id="regConfirmPassword"
              type={showPassword ? 'text' : 'password'}
              className="form-control cinema-input w-100"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Optional Admin Secret Key */}
          {isAdminRegister && (
            <div className="mb-3 text-start">
              <label className="cinema-label text-warning" htmlFor="adminSecret">
                Admin Authorization Key
              </label>
              <input
                id="adminSecret"
                type="password"
                className="form-control cinema-input w-100 border-warning"
                placeholder="Enter admin authorization key"
                value={adminSecretKey}
                onChange={(e) => setAdminSecretKey(e.target.value)}
                required
              />
              <small className="text-muted d-block mt-1">
                Authorized administrator security key required to provision admin privileges.
              </small>
            </div>
          )}

          {/* Show Password Checkbox matching Screenshot 1 */}
          <div className="form-check text-start mb-4">
            <input
              className="form-check-input"
              type="checkbox"
              id="showPasswordCheckReg"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              style={{
                backgroundColor: showPassword ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
              }}
            />
            <label
              className="form-check-label small"
              htmlFor="showPasswordCheckReg"
              style={{ color: '#9CA3AF', cursor: 'pointer' }}
            >
              Show Password
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-cinema w-100 py-2 mb-3"
            disabled={loading}
            style={{ fontWeight: '600' }}
          >
            {loading ? 'Creating account...' : 'Submit'}
          </button>

          {/* Already have an account link matching Screenshot 1 */}
          <div className="text-center small mb-2" style={{ color: '#9CA3AF' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-decoration-none fw-bold"
              style={{ color: 'var(--color-primary)' }}
            >
              Login
            </Link>
          </div>

          {/* Register as an Admin link matching Screenshot 1 */}
          <div className="text-center small mt-2">
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none small"
              style={{ color: isAdminRegister ? '#9CA3AF' : 'var(--color-primary)', fontSize: '0.85rem' }}
              onClick={() => setIsAdminRegister(!isAdminRegister)}
            >
              {isAdminRegister ? '← Back to standard user registration' : 'Register as an Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
