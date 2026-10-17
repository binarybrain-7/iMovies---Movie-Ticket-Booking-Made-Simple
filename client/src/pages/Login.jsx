import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectPath = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.username}!`);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page d-flex align-items-center justify-content-center py-5 px-3"
      style={{
        minHeight: '80vh',
        backgroundColor: '#08090D',
      }}
    >
      <div
        className="cinema-card shadow-lg"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#111827',
          border: '1px solid #E50914',
          borderRadius: '12px',
          padding: '2.5rem 2rem',
        }}
      >
        {/* Header matching Screenshot 2 */}
        <div className="text-center mb-4">
          <div className="brand-logo mb-1" style={{ fontSize: '2rem' }}>
            <span className="brand-i">i</span>
            <span className="brand-movies">Movies</span>
          </div>
          <h2 className="h5 fw-bold" style={{ color: '#F9FAFB' }}>
            Login
          </h2>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="mb-3 text-start">
            <label className="cinema-label" htmlFor="loginEmail">
              Email
            </label>
            <input
              id="loginEmail"
              type="email"
              className="form-control cinema-input w-100"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Password Field */}
          <div className="mb-3 text-start">
            <label className="cinema-label" htmlFor="loginPassword">
              Password
            </label>
            <input
              id="loginPassword"
              type={showPassword ? 'text' : 'password'}
              className="form-control cinema-input w-100"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Show Password Checkbox matching Screenshot 2 */}
          <div className="form-check text-start mb-4">
            <input
              className="form-check-input"
              type="checkbox"
              id="showPasswordCheck"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              style={{
                backgroundColor: showPassword ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
              }}
            />
            <label
              className="form-check-label small"
              htmlFor="showPasswordCheck"
              style={{ color: '#9CA3AF', cursor: 'pointer' }}
            >
              Show Password
            </label>
          </div>

          {/* Submit Button matching Screenshot 2 */}
          <button
            type="submit"
            className="btn btn-cinema w-100 py-2 mb-3"
            disabled={loading}
            style={{ fontWeight: '600' }}
          >
            {loading ? 'Signing in...' : 'Submit'}
          </button>

          {/* Create an account link matching Screenshot 2 */}
          <div className="text-center small mt-3" style={{ color: '#9CA3AF' }}>
            Create an account{' '}
            <Link
              to="/register"
              className="text-decoration-none fw-bold"
              style={{ color: 'var(--color-primary)' }}
            >
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
