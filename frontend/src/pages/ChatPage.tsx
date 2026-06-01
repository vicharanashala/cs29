import React, { useEffect } from 'react';
import { YakshaChat } from '../components/YakshaChat';
import '../styles/chat.css';
import '../reference.css';

export const ChatPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="chat-page">
      <div className="chat-container">
        <YakshaChat isModal={false} onClose={() => {}} />
      </div>
    </div>
  );
};

