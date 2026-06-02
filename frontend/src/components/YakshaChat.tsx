import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Trash2, Send, Sparkles, BookOpen, HelpCircle, Award, Clock, Mic,
  Plus, MessageSquare, Edit2, Copy, ThumbsUp, ThumbsDown, Volume2, VolumeX,
  PanelLeftClose, PanelLeft
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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

const INITIAL_MESSAGE_TEXT = "Hello! I'm <strong>Yaksha-mini</strong>, your AI mentor for the Vicharanashala Internship. I can help you with NOC queries, offer letters, programme details, coursework doubts, and technical guidance. How can I help you today?";

const DEFAULT_SUGGESTIONS = [
  { icon: HelpCircle, text: "What is the NOC process?", category: "Logistics" },
  { icon: BookOpen, text: "Tell me about Phase 1 coursework", category: "Coursework" },
  { icon: Award, text: "How do I earn the Gold badge?", category: "Badges" },
  { icon: Clock, text: "What are the attendance rules?", category: "Policy" },
];

export const YakshaChat: React.FC<YakshaChatProps> = ({ isModal, onClose }) => {
  const { isAuthenticated, user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [allowScroll, setAllowScroll] = useState(false);

  const storageKey = user?.email ? `yaksha_chat_sessions_${user.email}` : 'yaksha_chat_sessions_guest';

  useEffect(() => {
    const timer = setTimeout(() => {
      setAllowScroll(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSupported] = useState(() => !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  ));

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
    const saved = localStorage.getItem(storageKey);
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
    if (isAuthenticated) {
      localStorage.setItem(storageKey, JSON.stringify([initialSession]));
    }
  }, [storageKey, isAuthenticated]);

  // Sync sessions to localStorage
  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    if (isAuthenticated) {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  };

  // Get active session
  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === currentSessionId) || null;
  }, [sessions, currentSessionId]);

  // Scroll to bottom on message updates
  useEffect(() => {
    if (!allowScroll) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isTyping, allowScroll]);

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

      let restartTimeout: ReturnType<typeof setTimeout> | null = null;

      const startListening = () => {
        if (!recognitionRef.current) return;
        try {
          recognitionRef.current.start();
          setIsListening(true);
          setVoiceError(null);
        } catch (e) {
          console.error('Speech recognition start failed:', e);
          setVoiceError('Could not start microphone. Please allow microphone access.');
          setIsListening(false);
          setIsVoiceModalOpen(false);
        }
      };

      // onerror: show user-friendly message, but keep modal open for retry
      recognition.onerror = (event: any) => {
        if (restartTimeout) clearTimeout(restartTimeout);
        let errorMessage: string;
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings and reload the page.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please speak clearly and try again.';
            break;
          case 'network':
            errorMessage = 'Speech service unavailable. Check your internet or try again in a moment.';
            break;
          case 'aborted':
            // User cancelled — no error message needed
            return;
          default:
            errorMessage = 'Microphone error. Please try again.';
        }
        setVoiceError(errorMessage);
        setIsListening(false);
        // Keep modal open so user can retry
      };

      // onend: always auto-restart while modal is open (continuous listening)
      recognition.onend = () => {
        if (isVoiceModalOpen) {
          restartTimeout = setTimeout(startListening, 300);
        } else {
          setIsListening(false);
        }
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const openVoiceModal = async () => {
    if (!voiceSupported) return;
    setVoiceTranscript('');
    setVoiceError(null);
    setIsVoiceModalOpen(true);
    setIsListening(false); // Don't set true until recognition actually starts

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Speech recognition start failed:', e);
        setVoiceError('Could not start microphone. Please allow microphone access and try again.');
        setIsListening(false);
        setIsVoiceModalOpen(false);
      }
    }
  };

  const closeVoiceModalCancel = () => {
    setIsVoiceModalOpen(false);
    setIsListening(false);
    setVoiceError(null);
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
            ? 'Yaksha-mini is receiving too many requests right now. Please wait a moment and try again.'
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
                className={`history-session-item ${session.id === currentSessionId ? 'active' : ''}`}
                onClick={() => { setCurrentSessionId(session.id); if (!isSidebarOpen) setIsSidebarOpen(true); }}
              >
                <MessageSquare size={14} className="session-icon" />
                <div className="session-info">
                  {editingSessionId === session.id ? (
                    <input
                      className="session-rename-input"
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
                  <span className="session-date">{session.createdAt}</span>
                </div>
                
                <div className="session-actions">
                  <button
                    type="button"
                    className="session-action-btn"
                    onClick={(e) => { e.stopPropagation(); handleStartEditing(session); }}
                    title="Rename session"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    className="session-action-btn delete"
                    onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                    title="Delete session"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
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
                Yaksha-mini <Sparkles size={14} color={"var(--accent)"} />
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
            <div className="yaksha-welcome-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', flex: 1 }}>
              <div className="yaksha-welcome-card" style={{ maxWidth: '640px', width: '100%' }}>
                <div className="yaksha-welcome-logo" style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'var(--accent-glow-strong)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 30px var(--accent-glow)' }}>
                  <Sparkles size={28} color="var(--accent)" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Welcome to Yaksha-mini</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px', lineHeight: 1.5 }}>
                  Your AI mentor for the Vicharanashala Internship Programme. Ask me anything!
                </p>

                <div className="yaksha-prompts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                  {DEFAULT_SUGGESTIONS.map((prompt, i) => (
                    <button
                      key={i}
                      className="yaksha-prompt-card"
                      onClick={() => handleSend(undefined, prompt.text)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        alignItems: 'flex-start',
                        padding: '16px 20px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.borderColor = 'var(--border-active)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.background = 'var(--bg-card-hover)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = 'var(--bg-card)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-glow)', padding: '6px', borderRadius: '6px', color: 'var(--accent)' }}>
                          <prompt.icon size={15} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>
                          {prompt.category}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', textAlign: 'left', lineHeight: 1.4 }}>
                        {prompt.text}
                      </span>
                    </button>
                  ))}
                </div>
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
                  <div style={{ width: '100%', maxWidth: '85%', display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
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
        <div className="yaksha-voice-overlay" onClick={closeVoiceModalCancel}>
          <div className="yaksha-voice-popup" onClick={(e) => e.stopPropagation()}>
            <div className="yaksha-voice-popup-header">
              <h3 className="yaksha-voice-popup-title">Voice Command</h3>
              <button className="yaksha-close-btn" onClick={closeVoiceModalCancel}>✕</button>
            </div>

            {/* Pulsar mic indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 20px' }}>
              <div className={`yaksha-voice-pulsar-ring ${isListening ? 'active' : ''}`}>
                <div className="yaksha-voice-pulsar-ring-inner">
                  {isListening ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <div className="wave-bar bar-1" /><div className="wave-bar bar-2" /><div className="wave-bar bar-3" />
                    </div>
                  ) : (
                    <Mic size={26} color="var(--accent)" />
                  )}
                </div>
              </div>
            </div>
            {/* Status text */}
            <p className="yaksha-voice-popup-status" style={voiceError ? { color: '#f59e0b' } : {}}>
              {voiceError
                ? voiceError
                : isListening
                ? '● Recording…'
                : voiceTranscript
                ? '✓ Speech detected'
                : 'Tap the mic and ask your question'}
            </p>

            {/* Real-time transcript */}
            <div className="yaksha-voice-transcript-box">
              {voiceTranscript ? (
                <p className="yaksha-voice-transcript-text">{voiceTranscript}</p>
              ) : (
                <p className="yaksha-voice-transcript-placeholder">Your words will appear here in real-time…</p>
              )}
            </div>

            {/* Action buttons below transcript */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', width: '100%' }}>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: voiceTranscript.trim() ? 'var(--accent)' : 'var(--bg-input)',
                  color: voiceTranscript.trim() ? '#000000' : 'var(--text-muted)',
                  border: voiceTranscript.trim() ? 'none' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: voiceTranscript.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font)',
                  boxShadow: voiceTranscript.trim() ? '0 4px 12px rgba(240, 192, 64, 0.2)' : 'none',
                }}
                onClick={closeVoiceModalDone}
                disabled={!voiceTranscript.trim()}
              >
                Use Transcript
              </button>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'transparent',
                  color: '#ff3b30',
                  border: '1px solid rgba(255, 59, 48, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font)',
                }}
                onClick={closeVoiceModalCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
