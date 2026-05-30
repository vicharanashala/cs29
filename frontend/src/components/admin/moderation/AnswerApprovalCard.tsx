import React from 'react';
import { CheckCircle2, Edit3 } from 'lucide-react';

interface Reply {
  author: string;
  role: 'student' | 'mentor' | 'admin';
  text: string;
  time: string;
}

interface AnswerApprovalCardProps {
  reply: Reply;
  onApprove: (text: string) => void;
  onReframe: (text: string) => void;
}

export const AnswerApprovalCard: React.FC<AnswerApprovalCardProps> = ({
  reply,
  onApprove,
  onReframe,
}) => {
  const roleColor =
    reply.role === 'mentor'
      ? 'var(--accent)'
      : reply.role === 'admin'
        ? '#bf5af2'
        : 'var(--text-primary)';

  const roleLabel =
    reply.role === 'mentor' ? 'Mentor' : reply.role === 'admin' ? 'Admin' : 'Peer';

  return (
    <div className="admin-answer-card">
      <div className="admin-answer-meta">
        <span className="admin-answer-author" style={{ color: roleColor }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: roleColor,
              display: 'inline-block',
            }}
          />
          {reply.author} · {roleLabel}
        </span>
        <span className="admin-answer-time">{reply.time}</span>
      </div>
      <div className="admin-answer-text">{reply.text}</div>
      <div className="admin-answer-actions">
        <button
          type="button"
          className="admin-approve-btn"
          onClick={() => onApprove(reply.text)}
        >
          <CheckCircle2 size={14} /> Approve Answer
        </button>
        <button
          type="button"
          className="admin-reframe-btn"
          onClick={() => onReframe(reply.text)}
        >
          <Edit3 size={14} /> Reframe
        </button>
      </div>
    </div>
  );
};

export default AnswerApprovalCard;
