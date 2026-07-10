import React from 'react';
import { Button } from './button';

export default function CustomModal({ isOpen, title, message, isConfirm, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] p-6 text-center glass-panel border border-white/10 rounded-2xl animate-[modal-enter_0.35s_cubic-bezier(0.175,0.885,0.32,1.275)]">
        {title && (
          <h3 className="text-lg font-bold text-yellow-400 mb-3 drop-shadow-[0_0_8px_rgba(234,179,8,0.2)]">
            {title}
          </h3>
        )}
        <p className="text-slate-800 dark:text-gray-200 text-sm mb-6 leading-relaxed whitespace-pre-wrap">
          {message}
        </p>
        
        <div className="flex gap-3 justify-center">
          {isConfirm ? (
            <>
              <Button 
                variant="outline" 
                className="flex-1 h-auto py-5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 font-bold rounded-xl" 
                onClick={onCancel}
              >
                Hủy
              </Button>
              <Button 
                variant="default" 
                className="flex-1 h-auto py-5 bg-blue-600 hover:bg-blue-500 font-extrabold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] rounded-xl" 
                onClick={onConfirm}
              >
                Đồng ý
              </Button>
            </>
          ) : (
            <Button 
              variant="default" 
              className="w-full h-auto py-5 bg-blue-600 hover:bg-blue-500 font-extrabold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] rounded-xl" 
              onClick={onConfirm}
            >
              Đồng ý
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
