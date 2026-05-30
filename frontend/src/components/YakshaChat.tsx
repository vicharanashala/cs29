import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Trash2, Send, Sparkles, BookOpen, HelpCircle, Award, Clock, Mic,
  Plus, MessageSquare, Edit2, Copy, ThumbsUp, ThumbsDown, Volume2, VolumeX,
  PanelLeftClose, PanelLeft
} from 'lucide-react';
import axios from 'axios';

interface FaqRef {
  _id: string;
  question: string;
  answer: string;
  category: string;
  refNumber?: string;
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
  time: string;
  feedback?: 'like' | 'dislike';
  matchedFaqs?: FaqRef[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

interface YakshaChatProps {
  isModal: boolean;
  onClose: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL as string;

/** Strip HTML tags from FAQ answer strings before displaying in cards */
const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, '').trim();

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const INITIAL_MESSAGE_TEXT = "Hello! I'm <strong>Yaksha</strong>, your AI mentor for the Vicharanashala Internship. I can help you with NOC queries, offer letters, programme details, coursework doubts, and technical guidance. How can I help you today?";

const DEFAULT_SUGGESTIONS = [
  { icon: HelpCircle, text: "What is the NOC process?", category: "Logistics" },
  { icon: BookOpen, text: "Tell me about Phase 1 coursework", category: "Coursework" },
  { icon: Award, text: "How do I earn the Gold badge?", category: "Badges" },
  { icon: Clock, text: "What are the attendance rules?", category: "Policy" },
];

export const YakshaChat: React.FC<YakshaChatProps> = ({ isModal, onClose }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSupported] = useState(() => !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  ));
  const [continuousListening, setContinuousListening] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load chat sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('yaksha_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatSession[];
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error('Failed to parse chat sessions', e);
      }
    }

    // Create initial session if none exist
    const initialSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Mentorship Session",
      messages: [{ text: INITIAL_MESSAGE_TEXT, sender: 'bot', time: getTime() }],
      createdAt: new Date().toLocaleDateString(),
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);
    localStorage.setItem('yaksha_chat_sessions', JSON.stringify([initialSession]));
  }, []);

  // Sync sessions to localStorage
  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    localStorage.setItem('yaksha_chat_sessions', JSON.stringify(updated));
  };

  // Get active session
  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === currentSessionId) || null;
  }, [sessions, currentSessionId]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isTyping]);

  // Cleanup Text-To-Speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const currentText = finalTranscript || interimTranscript;
        setVoiceTranscript(currentText);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const openVoiceModal = () => {
    if (!voiceSupported) return;
    setVoiceTranscript('');
    setIsVoiceModalOpen(true);
    setIsListening(true);
    if (recognitionRef.current) {
      recognitionRef.current.continuous = continuousListening;
    }
    setTimeout(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Speech recognition start failed:", e);
        }
      }
    }, 100);
  };

  const closeVoiceModalCancel = () => {
    setIsVoiceModalOpen(false);
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }
  };

  const closeVoiceModalDone = () => {
    setIsVoiceModalOpen(false);
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    if (voiceTranscript.trim()) {
      setInputValue(voiceTranscript.trim());
    }
  };

  const handleSend = (e?: React.FormEvent, promptText?: string) => {
    if (e) e.preventDefault();
    const textToSend = promptText || inputValue.trim();
    if (!textToSend || !activeSession) return;

    // Create user message
    const userMessage: Message = { text: textToSend, sender: 'user', time: getTime() };
    const updatedMessages = [...activeSession.messages, userMessage];

    // If it was default session name, rename it to user's first prompt
    let sessionTitle = activeSession.title;
    if (sessionTitle === "New Mentorship Session") {
      sessionTitle = textToSend.length > 25 ? textToSend.substring(0, 25) + '...' : textToSend;
    }

    const updatedSession: ChatSession = {
      ...activeSession,
      title: sessionTitle,
      messages: updatedMessages,
    };

    const updatedSessions = sessions.map(s => s.id === currentSessionId ? updatedSession : s);
    saveSessions(updatedSessions);
    setInputValue('');
    setIsTyping(true);

    // Call our real /api/chat endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const chatUrl = `${import.meta.env.VITE_API_URL}/api/chat`;
    const chatBody = JSON.stringify({ query: textToSend });
    console.log('[YakshaChat] Sending to:', chatUrl, 'Body:', chatBody);

    fetch(chatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: chatBody,
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Server error: ' + res.status);
        return res.json();
      })
      .then((data) => {
        console.log('[YakshaChat] Response:', data);
        const answer: string = data.answer ?? 'Sorry, I could not get an answer right now.';
        const matchedFaqs: FaqRef[] = Array.isArray(data?.matchedFaqs) ? data.matchedFaqs : [];

        const botResponse: Message = {
          text: answer,
          sender: 'bot',
          time: getTime(),
          matchedFaqs,
        };

        const finalMessages = [...updatedMessages, botResponse];
        const finalSession = { ...updatedSession, messages: finalMessages };
        const finalSessions = sessions.map(s => s.id === currentSessionId ? finalSession : s);

        // Increment view count on matched FAQ if present
        if (matchedFaqs.length > 0 && matchedFaqs[0]._id) {
          axios.patch(`${API_BASE}/api/faqs/${matchedFaqs[0]._id}/view`).catch(() => {});
        }

        setIsTyping(false);
        saveSessions(finalSessions);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        setIsTyping(false);
        console.error('[YakshaChat] Fetch error:', err?.message ?? err);
        const msg = err?.message || '';
        const isAbort = msg.includes('abort');
        const is5xx = msg.includes('503') || msg.includes('500') || msg.includes('502') || msg.includes('504');
        const is429 = msg.includes('429');
        const isNetworkError = msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network');
        const isServerError = isAbort || is5xx || is429 || isNetworkError;

        const botResponse: Message = {
          text: isServerError
            ? 'Yaksha is receiving too many requests right now. Please wait a moment and try again.'
            : 'Sorry, I could not connect to the server. Please try again.',
          sender: 'bot',
          time: getTime(),
        };

        const finalMessages = [...updatedMessages, botResponse];
        const finalSession = { ...updatedSession, messages: finalMessages };
        const finalSessions = sessions.map(s => s.id === currentSessionId ? finalSession : s);
        saveSessions(finalSessions);
      });
  };

  // Thumbs up / down feedback
  const handleFeedback = (index: number, type: 'like' | 'dislike') => {
    if (!activeSession) return;
    const updatedMsgs = activeSession.messages.map((msg, idx) => {
      if (idx === index) {
        return { ...msg, feedback: msg.feedback === type ? undefined : type };
      }
      return msg;
    });
    const updatedSession = { ...activeSession, messages: updatedMsgs };
    const updatedSessions = sessions.map(s => s.id === currentSessionId ? updatedSession : s);
    saveSessions(updatedSessions);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const handleSpeak = (text: string, index: number) => {
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ''));
    utterance.rate = 0.95;
    utterance.pitch = 1;
    ttsUtteranceRef.current = utterance;
    utterance.onend = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Mentorship Session",
      messages: [{ text: INITIAL_MESSAGE_TEXT, sender: 'bot', time: getTime() }],
      createdAt: new Date().toLocaleDateString(),
    };
    const updatedSessions = [newSession, ...sessions];
    saveSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    if (updatedSessions.length === 0) {
      handleNewSession();
      return;
    }
    saveSessions(updatedSessions);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(updatedSessions[0].id);
    }
  };

  const handleStartEditing = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditTitleText(session.title);
  };

  const handleSaveTitle = (sessionId: string) => {
    const updatedSessions = sessions.map(s =>
      s.id === sessionId ? { ...s, title: editTitleText || s.title } : s
    );
    saveSessions(updatedSessions);
    setEditingSessionId(null);
  };

  return (
    <div className={`yaksha-layout-wrapper ${isModal ? '' : 'yaksha-dashboard'}`}>
      {/* History Sidebar */}
      {!isModal && (
        <aside className={`yaksha-history-sidebar${isSidebarOpen ? '' : ' closed'}`}>
          <div className="sidebar-header">
            <h3>Chat History</h3>
            <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(v => !v)} title="Toggle sidebar">
              <PanelLeftClose size={18} />
            </button>
          </div>

          <button className="new-chat-btn" onClick={handleNewSession}>
            <Plus size={16} />
            New Session
          </button>

          <div className="session-list">
            {sessions.map(session => (
              <div
                key={session.id}
                className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
                onClick={() => { setCurrentSessionId(session.id); if (!isSidebarOpen) setIsSidebarOpen(true); }}
              >
                <MessageSquare size={14} />
                {editingSessionId === session.id ? (
                  <input
                    className="session-title-input"
                    value={editTitleText}
                    onChange={e => setEditTitleText(e.target.value)}
                    onBlur={() => handleSaveTitle(session.id)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(session.id); }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="session-title">{session.title}</span>
                )}
                <button
                  className="session-action"
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                  title="Delete session"
                >
                  <Trash2 size={12} />
                </button>
                <button
                  className="session-action"
                  onClick={(e) => { e.stopPropagation(); handleStartEditing(session); }}
                  title="Rename session"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Main Chat Area */}
      <div className="yaksha-main-area">
        {/* Header */}
        <div className="yaksha-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!isModal && (
              <button
                className="sidebar-toggle"
                onClick={() => setIsSidebarOpen(v => !v)}
                style={isSidebarOpen ? { display: 'none' } : {}}
              >
                <PanelLeft size={18} />
              </button>
            )}
            <div className="yaksha-logo-badge">Y</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Yaksha <Sparkles size={14} color={"var(--accent)"} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="yaksha-online-dot" />
                AI Mentor · RAG-Powered
              </div>
            </div>
          </div>

          {isModal && (
            <button className="yaksha-close-btn" onClick={onClose}>✕</button>
          )}
        </div>

        {/* Messages Area */}
        <div className="yaksha-messages" style={{ flex: 1, overflowY: 'auto' }}>
          {activeSession && activeSession.messages.length === 1 && (
            <div className="yaksha-welcome">
              <div className="yaksha-welcome-icon">
                <Sparkles size={32} color="var(--accent)" />
              </div>
              <h2>Welcome to Yaksha</h2>
              <p>Your AI mentor for the Vicharanashala Internship Programme. Ask me anything!</p>

              <div className="yaksha-prompts-grid">
                {DEFAULT_SUGGESTIONS.map((prompt, i) => (
                  <button
                    key={i}
                    className="yaksha-prompt-card"
                    onClick={() => handleSend(undefined, prompt.text)}
                  >
                    <prompt.icon size={18} color="var(--accent)" />
                    <span className="yaksha-prompt-card-text">{prompt.text}</span>
                    <span className="yaksha-prompt-category">{prompt.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSession && activeSession.messages.length > 1 && (
            <div className="yaksha-conversation-area">
              {activeSession.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`yaksha-msg ${msg.sender === 'user' ? 'yaksha-msg--user' : 'yaksha-msg--bot'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="yaksha-msg-avatar">Y</div>
                  )}
                  <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column' }}>
                    {msg.text && (
                      <div
                        className="yaksha-bubble"
                        dangerouslySetInnerHTML={{ __html: msg.text }}
                      />
                    )}

                    {/* FAQ Cards (rendered below the text bubble) */}
                    {msg.matchedFaqs && msg.matchedFaqs.length > 0 && (
                      <div className="yaksha-faq-cards">
                        {msg.matchedFaqs.map((faq) => (
                          <a
                            key={faq._id}
                            href={`/faq#${faq._id}`}
                            className="yaksha-faq-card"
                            onClick={(e) => {
                              e.preventDefault();
                              if (isModal) window.location.href = `/faq#${faq._id}`;
                              else window.location.href = `/faq#${faq._id}`;
                            }}
                          >
                            <div className="yaksha-faq-card-header">
                              <span className="yaksha-faq-refnum">{faq.refNumber ?? 'FAQ'}</span>
                              <span className="yaksha-faq-cat">{faq.category}</span>
                            </div>
                            <div className="yaksha-faq-question">{faq.question}</div>
                            <div className="yaksha-faq-answer">{stripHtml(faq.answer)}</div>
                            <div className="yaksha-faq-cta">Read more in FAQ →</div>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Bot Message Toolbar Actions */}
                    {msg.sender === 'bot' && (
                      <div className="bot-message-actions-bar">
                        <button
                          type="button"
                          className="message-action-icon"
                          onClick={() => handleCopy(msg.text, index)}
                          title="Copy message"
                        >
                          <Copy size={12} />
                          {copiedIndex === index && <span className="action-tooltip">Copied!</span>}
                        </button>

                        <button
                          type="button"
                          className={`message-action-icon ${speakingIndex === index ? 'speaking' : ''}`}
                          onClick={() => handleSpeak(msg.text, index)}
                          title={speakingIndex === index ? "Stop Speaking" : "Read Aloud"}
                        >
                          {speakingIndex === index ? <VolumeX size={12} /> : <Volume2 size={12} />}
                        </button>

                        <button
                          type="button"
                          className={`message-action-icon ${msg.feedback === 'like' ? 'liked' : ''}`}
                          onClick={() => handleFeedback(index, 'like')}
                          title="Helpful response"
                        >
                          <ThumbsUp size={12} />
                        </button>

                        <button
                          type="button"
                          className={`message-action-icon ${msg.feedback === 'dislike' ? 'disliked' : ''}`}
                          onClick={() => handleFeedback(index, 'dislike')}
                          title="Not helpful"
                        >
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    )}

                    <div className="yaksha-time">{msg.time}</div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="yaksha-msg yaksha-msg--bot yaksha-typing">
                  <div className="yaksha-msg-avatar">Y</div>
                  <div className="yaksha-bubble">
                    <div className="yaksha-typing-dots">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form className="yaksha-input-area" onSubmit={(e) => handleSend(e)}>
          <div className="yaksha-input-inner">
            <button
              type="button"
              onClick={voiceSupported ? openVoiceModal : undefined}
              title={voiceSupported ? 'Voice Command' : 'Voice input not supported in this browser'}
              className="yaksha-voice-btn"
              style={{
                position: 'relative',
                opacity: voiceSupported ? 1 : 0.45,
                cursor: voiceSupported ? 'pointer' : 'not-allowed',
              }}
            >
              <Mic size={16} />
              {isListening && (
                <span style={{
                  position: 'absolute', top: '3px', right: '3px',
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: '#ff3b30',
                  animation: 'pulse 1s ease-in-out infinite',
                }} />
              )}
            </button>

            <input
              type="text"
              className="yaksha-input"
              placeholder="Ask about NOC, coursework, badges…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />

            <button
              type="submit"
              className="yaksha-send-btn"
              disabled={!inputValue.trim()}
              title="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Voice Modal */}
      {isVoiceModalOpen && (
        <div className="yaksha-voice-popup-overlay" onClick={closeVoiceModalCancel}>
          <div className="yaksha-voice-popup" onClick={(e) => e.stopPropagation()}>
            <div className="yaksha-voice-popup-header">
              <h3>Voice Command</h3>
              <button className="yaksha-close-btn" onClick={closeVoiceModalCancel}>✕</button>
            </div>

            {/* Recording status with pulsing indicator */}
            <div className={`yaksha-voice-status ${isListening ? 'listening' : ''}`}>
              <div className="yaksha-voice-wave" style={{ position: 'relative' }}>
                {isListening ? (
                  <>
                    <div className="wave-bars"><span/><span/><span/><span/><span/></div>
                    <span style={{
                      position: 'absolute', top: '-6px', right: '-6px',
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: '#ff3b30', boxShadow: '0 0 0 0 rgba(255,59,48,0.4)',
                      animation: 'pulse 1s ease-in-out infinite',
                    }} />
                  </>
                ) : (
                  <Mic size={32} color="var(--accent)" />
                )}
              </div>
              <p style={{ fontWeight: isListening ? 700 : 400 }}>
                {isListening ? '● Recording…' : 'Ready to listen'}
              </p>
            </div>

            {/* Real-time transcript */}
            <div className="yaksha-voice-transcript-box">
              <p className="yaksha-voice-transcript-text" style={{ minHeight: '48px' }}>
                {voiceTranscript || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Your words will appear here in real-time…</span>}
              </p>
            </div>

            {/* Continuous listening toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Continuous listening</span>
              <button
                type="button"
                onClick={() => setContinuousListening((v) => !v)}
                style={{
                  width: '36px', height: '20px', borderRadius: '10px', border: 'none',
                  background: continuousListening ? 'var(--accent)' : 'var(--border)',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: '3px',
                  left: continuousListening ? '18px' : '3px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                }} />
              </button>
            </div>

            <div className="yaksha-voice-popup-actions">
              <button className="voice-btn-cancel" onClick={closeVoiceModalCancel}>Cancel</button>
              <button className="voice-btn-done" onClick={closeVoiceModalDone} disabled={!voiceTranscript.trim()}>
                Use Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
