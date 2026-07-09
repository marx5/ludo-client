import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import './RealtimeChat.css';

export default function RealtimeChat({
  chatMessages = [],
  onSendMessage,
  title = 'Hộp chat',
  TitleIcon = MessageSquare,
  placeholder = 'Gửi tin nhắn...',
  emptyText = 'Chưa có tin nhắn nào.',
  className = '',
  size = 'sm'
}) {
  const [chatInput, setChatInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() && onSendMessage) {
      onSendMessage(chatInput);
      setChatInput('');
    }
  };

  const isXs = size === 'xs';

  return (
    <div className={`chat-panel glass-panel flex-grow flex flex-col ${className}`}>
      <h3 className={`font-bold text-gray-400 p-4 border-b border-white/5 flex items-center gap-2 ${isXs ? 'text-xs' : 'text-sm'}`}>
        <TitleIcon size={isXs ? 14 : 16} />
        {title}
      </h3>
      
      <div className="chat-messages">
        {chatMessages.length === 0 ? (
          <div className={`text-center text-gray-500 my-auto ${isXs ? 'text-[11px]' : 'text-xs'}`}>
            {emptyText}
          </div>
        ) : (
          chatMessages.map((msg, idx) => (
            <div key={idx} className="chat-message">
              <span className={`chat-message-sender ${msg.senderColor}`}>
                {msg.senderName}:
              </span>
              <span className="text-gray-300">{msg.message}</span>
              <span className={`text-gray-500 float-right mt-1 ${isXs ? 'text-[9px]' : 'text-[10px]'}`}>
                {msg.time.split(' ')[0]}
              </span>
            </div>
          ))
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="chat-input-container">
        <input 
          type="text" 
          className={`glass-input flex-grow ${isXs ? 'py-2 text-xs' : 'py-2 text-sm'}`}
          placeholder={placeholder}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          maxLength={50}
        />
        <button type="submit" className="glass-button p-2" disabled={!chatInput.trim()}>
          <Send size={isXs ? 14 : 16} />
        </button>
      </form>
    </div>
  );
}
