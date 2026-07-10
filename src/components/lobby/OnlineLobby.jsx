import React, { useState } from 'react';
import { Check, X, Users, User, Share2, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COLORS } from '../../utils/gameEngine';
import RealtimeChat from '../game/RealtimeChat';

export default function OnlineLobby({
  socket,
  roomInfo,
  onChangeMode,
  onSelectColor,
  onToggleReady,
  onStartOnlineGame,
  onAddBot,
  onRemoveBot,
  onKickPlayer,
  onLeaveRoom,
  chatMessages,
  onSendChatMessage
}) {
  const isCreator = socket && socket.id === roomInfo.creatorId;
  const myPlayer = roomInfo.players.find(p => socket && p.id === socket.id);
  const isMeReady = myPlayer?.isReady || false;
  const [copied, setCopied] = useState(false);

  const renderSlot = (colorKey, colorLabel) => {
    const occupant = roomInfo.players.find(p => p.color === colorKey);
    const isSelected = myPlayer?.color === colorKey;

    // Color definitions for border/bg when occupied or empty
    const theme = {
      red: {
        text: 'text-red-600 dark:text-red-400 border-red-500/20 bg-red-500/5',
        emptyBorder: 'border-red-500/30 hover:border-red-500/70 hover:bg-red-500/5',
        badge: 'bg-red-600 border-red-400',
        badgeText: 'text-white'
      },
      green: {
        text: 'text-green-600 dark:text-green-400 border-green-500/20 bg-green-500/5',
        emptyBorder: 'border-green-500/30 hover:border-green-500/70 hover:bg-green-500/5',
        badge: 'bg-green-600 border-green-400',
        badgeText: 'text-white'
      },
      yellow: {
        text: 'text-yellow-600 dark:text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
        emptyBorder: 'border-amber-500/40 hover:border-amber-600 dark:border-yellow-500/30 hover:bg-yellow-500/5',
        badge: 'bg-yellow-500 border-yellow-300 dark:bg-yellow-600 dark:border-yellow-400',
        badgeText: 'text-yellow-950 dark:text-white font-black'
      },
      blue: {
        text: 'text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/5',
        emptyBorder: 'border-blue-500/30 hover:border-blue-500/70 hover:bg-blue-500/5',
        badge: 'bg-blue-600 border-blue-400',
        badgeText: 'text-white'
      }
    }[colorKey];

    if (occupant) {
      const isMe = socket && socket.id === occupant.id;
      const isOccupantCreator = occupant.id === roomInfo.creatorId;
      return (
        <div className="flex flex-col items-center relative" key={colorKey}>
          <div 
            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-black text-sm relative shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition-transform duration-300 ${theme.badge} ${theme.badgeText} ${
              isMe ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105' : ''
            }`}
          >
            {occupant.name.slice(0, 2).toUpperCase()}
            
            {/* Kick button for hosts to remove bots or real players */}
            {isCreator && occupant.id !== roomInfo.creatorId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onKickPlayer(occupant.id, occupant.name, occupant.isBot);
                }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 border border-rose-400 flex items-center justify-center text-[10px] font-black text-white hover:bg-rose-500 active:scale-90"
                title={`Kích ${occupant.name}`}
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="mt-2 flex flex-col items-center max-w-[84px] text-center">
            <span className="text-[11px] font-bold text-slate-800 dark:text-gray-200 truncate w-full">{occupant.name}</span>
            <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
              {isOccupantCreator ? (
                <span className="text-[8px] font-medium bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 dark:border-amber-500/35 flex items-center gap-0.5 shadow-sm">
                  <Shield size={8} className="fill-amber-500/20 text-amber-600 dark:text-amber-400" />
                  Chủ phòng
                </span>
              ) : (
                isMe && <span className="text-[8px] font-medium bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1 py-0.2 rounded border border-blue-500/20 dark:border-blue-500/30">Bạn</span>
              )}
              {occupant.isBot && <span className="text-[8px] font-medium bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-1 py-0.2 rounded border border-purple-500/20 dark:border-purple-500/30">Máy</span>}
            </div>
            {occupant.isReady ? (
              <span className="text-[9px] text-green-600 dark:text-green-400 font-semibold mt-0.5 flex items-center gap-0.5">
                <Check size={8} /> Sẵn sàng
              </span>
            ) : (
              <span className="text-[9px] text-slate-500 dark:text-gray-400 font-semibold mt-0.5 flex items-center gap-0.5">
                <X size={8} /> Chờ...
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center" key={colorKey}>
        <div 
          onClick={() => onSelectColor(colorKey)}
          className={`w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-300 bg-white/[0.01] active:scale-95 ${theme.emptyBorder}`}
          title="Bấm để ngồi vào vị trí này"
        >
          <span className="text-xl font-bold text-slate-400 dark:text-gray-500">+</span>
        </div>
        {isCreator && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddBot(colorKey);
            }}
            className="mt-2 px-1.5 py-0.5 text-[8px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded hover:bg-indigo-500/30 hover:border-indigo-500/50 transition-all active:scale-95"
          >
            + Máy
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="lobby-box glass-panel max-w-md w-full p-6 flex flex-col gap-6 text-left">
      
      {/* Thông tin phòng và Chọn màu */}
      <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Mã Phòng Chơi</span>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <h2 className="text-3xl font-black font-mono text-yellow-600 dark:text-yellow-400 tracking-widest select-all leading-none">{roomInfo.roomId}</h2>
              <Button
                onClick={() => {
                  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomInfo.roomId}`;
                  navigator.clipboard.writeText(shareUrl)
                    .then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    })
                    .catch(err => {
                      console.error('Lỗi sao chép: ', err);
                    });
                }}
                size="sm"
                className={`flex items-center gap-1.5 h-8 text-xs font-bold px-3 rounded-lg transition-all duration-200 active:scale-95 ${
                  copied 
                    ? 'bg-green-500/10 dark:bg-green-500/20 hover:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 dark:border-green-500/40' 
                    : 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30 dark:border-yellow-500/50'
                }`}
              >
                {copied ? <Check size={13} /> : <Share2 size={13} />}
                {copied ? 'Đã sao chép!' : 'Chia sẻ'}
              </Button>
            </div>
          </div>
          <Button 
            variant="destructive"
            size="sm"
            onClick={onLeaveRoom}
            className="bg-rose-500/10 dark:bg-rose-600/20 hover:bg-rose-500/20 dark:hover:bg-rose-600/30 text-rose-700 dark:text-rose-300 border border-rose-500/30 dark:border-rose-500/20 px-4 h-9"
          >
            <LogOut size={14} className="mr-1.5" />
            Rời phòng
          </Button>
        </div>

        {/* Chế độ chơi (Chỉ chủ phòng chỉnh) */}
        <div className="w-full">
          <span className="block text-sm font-semibold text-slate-500 dark:text-gray-400 mb-3">Chế độ chơi:</span>
          <div className="grid grid-cols-3 gap-4">
            {/* Card 1: 1vs1 */}
            <div 
              onClick={() => isCreator && onChangeMode('1vs1')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 select-none ${
                isCreator ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              } ${
                roomInfo.mode === '1vs1' 
                  ? 'bg-blue-500/10 border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-[1.02]' 
                  : 'bg-slate-100/50 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 hover:bg-slate-200/50 hover:border-slate-300 dark:hover:bg-white/[0.03] dark:hover:border-white/10'
              }`}
            >
              <div className={`p-2.5 rounded-xl mb-2 transition-colors ${roomInfo.mode === '1vs1' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-gray-400'}`}>
                <User size={20} />
              </div>
              <h4 className={`font-bold text-sm ${roomInfo.mode === '1vs1' ? 'text-blue-600 dark:text-blue-300' : 'text-slate-600 dark:text-gray-300'}`}>1vs1</h4>
            </div>

            {/* Card 2: 2vs2 */}
            <div 
              onClick={() => isCreator && onChangeMode('2vs2')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 select-none ${
                isCreator ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              } ${
                roomInfo.mode === '2vs2' 
                  ? 'bg-purple-500/10 border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.15)] scale-[1.02]' 
                  : 'bg-slate-100/50 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 hover:bg-slate-200/50 hover:border-slate-300 dark:hover:bg-white/[0.03] dark:hover:border-white/10'
              }`}
            >
              <div className={`p-2.5 rounded-xl mb-2 transition-colors ${roomInfo.mode === '2vs2' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-gray-400'}`}>
                <Users size={20} />
              </div>
              <h4 className={`font-bold text-sm ${roomInfo.mode === '2vs2' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-gray-300'}`}>2vs2</h4>
            </div>

            {/* Card 3: 1vs3 */}
            <div 
              onClick={() => isCreator && onChangeMode('1vs3')}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 select-none ${
                isCreator ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              } ${
                roomInfo.mode === '1vs3' 
                  ? 'bg-rose-500/10 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.15)] scale-[1.02]' 
                  : 'bg-slate-100/50 dark:bg-white/[0.01] border-slate-200 dark:border-white/5 hover:bg-slate-200/50 hover:border-slate-300 dark:hover:bg-white/[0.03] dark:hover:border-white/10'
              }`}
            >
              <div className={`p-2.5 rounded-xl mb-2 transition-colors ${roomInfo.mode === '1vs3' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-gray-400'}`}>
                <Users size={20} />
              </div>
              <h4 className={`font-bold text-sm ${roomInfo.mode === '1vs3' ? 'text-rose-600 dark:text-rose-300' : 'text-slate-600 dark:text-gray-300'}`}>1vs3</h4>
            </div>
          </div>

        </div>

        {/* Hàng ngang các vị trí chọn đội / ghế */}
        <div className="w-full flex flex-col items-center">
          <span className="block text-sm font-semibold text-slate-500 dark:text-gray-400 mb-4 self-start">Đội hình thi đấu:</span>
          
          <div className="flex items-center justify-center gap-4 w-full">
            {roomInfo.mode === '1vs1' ? (
              <>
                {/* Slot Đỏ */}
                {renderSlot('red', 'Đỏ')}
                
                {/* VS */}
                <div className="text-xl font-black text-rose-500 italic mx-4 select-none">VS</div>
                
                {/* Slot Vàng */}
                {renderSlot('yellow', 'Vàng')}
              </>
            ) : roomInfo.mode === '1vs3' ? (
              <>
                {/* 4 người chơi đối kháng tự do, xếp cạnh nhau */}
                <div className="flex gap-3 flex-wrap justify-center items-center w-full">
                  {renderSlot('red', 'Đỏ')}
                  <div className="text-sm font-bold text-rose-500 italic select-none">VS</div>
                  {renderSlot('green', 'Xanh')}
                  <div className="text-sm font-bold text-rose-500 italic select-none">VS</div>
                  {renderSlot('yellow', 'Vàng')}
                  <div className="text-sm font-bold text-rose-500 italic select-none">VS</div>
                  {renderSlot('blue', 'Lam')}
                </div>
              </>
            ) : (
              <>
                {/* Team 1 (Đỏ & Vàng) */}
                <div className="flex gap-4">
                  {renderSlot('red', 'Đỏ')}
                  {renderSlot('yellow', 'Vàng')}
                </div>
                
                {/* VS */}
                <div className="text-xl font-black text-rose-500 italic mx-4 select-none">VS</div>
                
                {/* Team 2 (Xanh lá & Xanh dương) */}
                <div className="flex gap-4">
                  {renderSlot('green', 'Xanh lá')}
                  {renderSlot('blue', 'Xanh dương')}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Nút Action */}
        <div className="w-full flex gap-4">
          {isCreator ? (
            <Button 
              className="flex-1 h-11 text-sm bg-green-600 hover:bg-green-500 text-white font-extrabold border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-300"
              onClick={() => onStartOnlineGame(true)}
            >
              Bắt Đầu
            </Button>
          ) : (
            <Button 
              className={`flex-1 h-11 text-sm font-bold border transition-all duration-300 ${
                isMeReady 
                  ? 'bg-rose-600 hover:bg-rose-500 border-rose-500/50 text-white shadow-[0_0_15px_rgba(244,63,94,0.25)]' 
                  : 'bg-blue-600 hover:bg-blue-500 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
              }`}
              onClick={onToggleReady}
            >
              {isMeReady ? 'Hủy Sẵn Sàng' : 'Sẵn Sàng'}
            </Button>
          )}
        </div>

      {/* Hộp Chatbox Realtime */}
      <div className="flex flex-col border-t border-slate-200/50 dark:border-white/5 pt-6">
        <RealtimeChat 
          chatMessages={chatMessages}
          onSendMessage={onSendChatMessage}
          title="Trò Chuyện"
          TitleIcon={Users}
          placeholder="Gửi tin nhắn..."
          emptyText="Chưa có tin nhắn nào. Chat cùng mọi người để chuẩn bị đấu!"
        />
      </div>

    </div>
  );
}
