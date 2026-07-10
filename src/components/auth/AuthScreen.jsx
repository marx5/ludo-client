import React, { useState } from 'react';
import { LogIn, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import './AuthScreen.css';
export default function AuthScreen({ onLogin, onGuest }) {
  const [mode, setMode] = useState('menu'); // 'menu', 'login', 'guest'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username);
    }
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onGuest(username);
    } else {
      onGuest('Khách');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-panel">
        <h1 className="auth-title">Ludo Z</h1>
        {mode === 'menu' && (
          <div className="auth-buttons flex flex-col items-center gap-4 mt-6">
            <Button 
              className="w-full sm:w-64 h-auto py-6 text-base bg-blue-600/50 hover:bg-blue-600/70 border-blue-500/50 shadow-[0_0_15px_rgba(30,144,255,0.3)]"
              onClick={() => setMode('login')}
            >
              Đăng Nhập
            </Button>
            <Button 
              className="w-full sm:w-64 h-auto py-6 text-base bg-yellow-500/40 hover:bg-yellow-500/60 text-yellow-100 font-bold border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
              onClick={() => setMode('guest')}
            >
              Chơi ngay
            </Button>
          </div>
        )}

        {mode === 'login' && (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Tên đăng nhập</label>
              <Input 
                type="text" 
                placeholder="Nhập tên đăng nhập..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group mt-4">
              <label>Mật khẩu</label>
              <Input 
                type="password" 
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-actions mt-6 grid grid-cols-2 gap-4">
              <Button 
                type="button" 
                variant="outline"
                className="w-full h-11 border-slate-300 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold"
                onClick={() => setMode('menu')}
              >
                Quay Lại
              </Button>
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600/50 hover:bg-blue-600/70 border-blue-500/50 shadow-[0_0_15px_rgba(30,144,255,0.3)] font-bold"
              >
                Vào Game
              </Button>
            </div>
          </form>
        )}

        {mode === 'guest' && (
          <form className="auth-form" onSubmit={handleGuestSubmit}>
            <div className="form-group">
              <label>Tên hiển thị của bạn</label>
              <Input 
                type="text" 
                className="text-center text-lg font-bold" 
                placeholder="Nhập tên..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={15}
                required
              />
            </div>
            <div className="form-actions mt-6 grid grid-cols-2 gap-4">
              <Button 
                type="button" 
                variant="outline"
                className="w-full h-11 border-slate-300 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold"
                onClick={() => setMode('menu')}
              >
                Quay Lại
              </Button>
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600/50 hover:bg-blue-600/70 border-blue-500/50 shadow-[0_0_15px_rgba(30,144,255,0.3)] font-bold"
              >
                Vào Game
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
