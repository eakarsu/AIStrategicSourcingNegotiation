import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({ show, onClose, onConfirm, title, message }) {
  return (
    <Modal show={show} onClose={onClose} title="">
      <div className="confirm-dialog">
        <h3>{title || 'Confirm Delete'}</h3>
        <p>{message || 'Are you sure you want to delete this item? This action cannot be undone.'}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </Modal>
  );
}
