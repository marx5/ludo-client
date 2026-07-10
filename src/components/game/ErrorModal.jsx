import React from 'react';
import './ErrorModal.css';

import { Button } from '@/components/ui/button';

export default function ErrorModal({ errorMessage, onClose }) {
  if (!errorMessage) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <h3 className="text-lg font-bold text-red-400 mb-2">Đã xảy ra lỗi</h3>
        <p className="text-gray-300 text-sm mb-6">{errorMessage}</p>
        <Button variant="default" className="w-full" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );
}
