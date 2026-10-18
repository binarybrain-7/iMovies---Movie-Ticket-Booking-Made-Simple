import React from 'react';
import { FiAlertTriangle, FiTrash2, FiX } from 'react-icons/fi';

const ConfirmModal = ({
  isOpen,
  title = 'Confirm Deletion',
  message,
  itemName,
  warningText,
  confirmButtonText = 'Confirm Delete',
  confirmButtonVariant = 'btn-danger',
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        zIndex: 1060,
        backdropFilter: 'blur(5px)',
      }}
      onClick={onClose}
    >
      <div
        className="cinema-card p-4 mx-3 shadow-2xl"
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#111827',
          border: '1px solid rgba(229, 9, 20, 0.4)',
          borderRadius: '12px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center gap-2 text-danger">
            <FiAlertTriangle size={24} className="flex-shrink-0" />
            <h5 className="modal-title mb-0 fw-bold text-light">{title}</h5>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-1 rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '28px', height: '28px' }}
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
          >
            <FiX size={16} />
          </button>
        </div>

        {message && (
          <p className="text-light mb-2" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
            {message}
          </p>
        )}

        {itemName && (
          <div
            className="p-3 my-3 rounded"
            style={{
              backgroundColor: '#08090D',
              borderLeft: '4px solid #E50914',
              color: '#F9FAFB',
              fontWeight: '600',
              fontSize: '0.95rem',
            }}
          >
            {itemName}
          </div>
        )}

        {warningText && (
          <div
            className="p-2 mb-3 rounded small text-warning d-flex align-items-center gap-2"
            style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}
          >
            <FiAlertTriangle size={16} className="flex-shrink-0" />
            <span>{warningText}</span>
          </div>
        )}

        <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top" style={{ borderColor: 'var(--color-border)' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm px-3"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${confirmButtonVariant} btn-sm px-4 d-flex align-items-center gap-2`}
            onClick={onConfirm}
            disabled={loading}
          >
            <FiTrash2 size={15} />
            {loading ? 'Processing...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
