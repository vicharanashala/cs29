import React from 'react';
import { MessageSquare } from 'lucide-react';
import { AnswerApprovalCard } from './AnswerApprovalCard';

interface Reply {
  author: string;
  role: 'student' | 'mentor' | 'admin';
  text: string;
  time: string;
}

interface AnswerReviewListProps {
  replies: Reply[];
  onApprove: (text: string) => void;
  onReframe: (text: string) => void;
}

export const AnswerReviewList: React.FC<AnswerReviewListProps> = ({
  replies,
  onApprove,
  onReframe,
}) => {
  if (replies.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
        <MessageSquare size={24} style={{ opacity: 0.4, marginBottom: '8px' }} />
        <p>No community answers submitted yet.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <MessageSquare size={16} style={{ color: 'var(--accent)' }} />
        Community Answers ({replies.length})
      </h3>
      {replies.map((reply, index) => (
        <AnswerApprovalCard
          key={index}
          reply={reply}
          onApprove={onApprove}
          onReframe={onReframe}
        />
      ))}
    </div>
  );
};

export default AnswerReviewList;
