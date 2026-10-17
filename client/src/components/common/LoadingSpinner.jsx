import React from 'react';

const LoadingSpinner = ({ message = 'Loading cinema experience...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div
        className="spinner-border mb-3"
        role="status"
        style={{
          width: '3rem',
          height: '3rem',
          color: 'var(--color-primary)',
          borderWidth: '0.25em',
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="small text-muted">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
