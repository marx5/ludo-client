import React from 'react';
import './ErrorModal.css';

export default function ErrorModal({ errorMessage, onClose }) {
  if (!errorMessage) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <h3 className="text-lg font-bold text-red-400 mb-2">Đã xảy ra lỗi</h3>
        <p className="text-gray-300 text-sm mb-6">{errorMessage}</p>
        <button className="glass-button active py-2 px-6" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}
