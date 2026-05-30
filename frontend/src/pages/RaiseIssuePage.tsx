import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Upload, CheckCircle2, Award, ShieldAlert, Mic, MicOff } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { SimilarFaqsHint } from '../components/SimilarFaqsHint';
import '../styles/portal.css';

interface SimilarFaq {
  _id: string;
  question: string;
  answer: string;
  category: string;
  score: number;
}

export const RaiseIssuePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('NOC');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [similarFaqs, setSimilarFaqs] = useState<SimilarFaq[]>([]);
  const [showSimilarHint, setShowSimilarHint] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const voiceRecognitionRef = useRef<any>(null);
  const voiceSupported = !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (title.trim().length < 8) {
      setSimilarFaqs([]);
      setShowSimilarHint(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faqs/similar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: title.trim() }),
        });
        const data: SimilarFaq[] = await res.json();
        if (data.length > 0) {
          setSimilarFaqs(data);
          setShowSimilarHint(true);
        } else {
          setSimilarFaqs([]);
          setShowSimilarHint(false);
        }
      } catch {
        setSimilarFaqs([]);
        setShowSimilarHint(false);
      }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [title]);

  if (!user) {
    navigate({ to: '/login' });
    return null;
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCvFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim(),
          urgency,
          raisedBy: user.email,
          raisedByName: user.name || user.email.split('@')[0],
        }),
      });

      if (!res.ok) throw new Error('Failed to submit');
      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to submit issue:', err);
      setSubmitError('Failed to submit issue. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVoiceDescription = () => {
    if (!voiceSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (isRecording) {
      try { voiceRecognitionRef.current?.stop(); } catch (_) {}
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.onresult = (event: any) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      setDescription(full);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    voiceRecognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleReset = () => {
    setTitle('');
    setCategory('NOC');
    setDescription('');
    setUrgency('medium');
    setCvFileName(null);
    setIsSubmitted(false);
    setSimilarFaqs([]);
    setShowSimilarHint(false);
  };

  return (
    <div className="portal-page">
      <div className="portal-container" style={{ maxWidth: '800px' }}>

        {/* Back Link */}
        <div style={{ marginBottom: '24px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <ArrowLeft size={16} /> Back to Overview
          </Link>
        </div>

        {isSubmitted ? (
          <div className="portal-form-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(52,199,89,0.1)', color: '#34c759', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>Issue Raised Successfully</h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 32px' }}>
              Your question has been entered into the active community queue. Other interns will be notified to answer, and our senior mentors will review any resolutions.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <button onClick={handleReset} className="btn-secondary">Raise Another</button>
              <Link to="/track-issues" className="btn-accent">Track My Issues</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="portal-header">
              <div className="portal-title-area">
                <span className="portal-overline">Intern portal</span>
                <h1 className="portal-title">Raise a New Issue</h1>
                <p className="portal-subtitle">
                  Stuck on something? Ask the Vicharanashala crowd. Your peers will help you resolve it, and answers are moderated by seniors.
                </p>
              </div>
            </div>

            {/* Spurti Point Banner */}
            <div className="portal-success-banner" style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--border-active)' }}>
              <Award size={18} />
              <span><strong>Spurti Peer-Help Loop:</strong> Asking clear, structural questions helps grow our shared FAQ database!</span>
            </div>

            <form onSubmit={handleSubmit} className="portal-form-card portal-form-grid">

              {/* Issue Title */}
              <div className="form-group form-full-width">
                <label className="form-label" htmlFor="title" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Issue Title
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  placeholder="e.g. NOC signed signature format verification, Phase 1 Rosetta submission issues"
                  className="form-input"
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font)' }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {showSimilarHint && (
                  <div style={{ marginTop: '10px' }}>
                    <SimilarFaqsHint
                      faqs={similarFaqs}
                      onDismiss={() => setShowSimilarHint(false)}
                      onSelect={(faq) => {
                        setShowSimilarHint(false);
                        window.open(`/faq#${faq._id}`, '_blank');
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Category selector */}
              <div className="form-group">
                <label className="form-label" htmlFor="category" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Category
                </label>
                <select
                  id="category"
                  className="form-input"
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font)' }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="NOC">No Objection Certificate (NOC)</option>
                  <option value="Coursework">Coursework & Rosetta</option>
                  <option value="Badges">Badges & Gamification</option>
                  <option value="Stipend">Stipends & Logistics</option>
                  <option value="Technical">Technical & Git Issues</option>
                  <option value="Other">Other Queries</option>
                </select>
              </div>

              {/* Urgency Level */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Urgency Level
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setUrgency(level)}
                      style={{
                        flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${urgency === level ? 'var(--accent)' : 'var(--border)'}`,
                        background: urgency === level ? 'var(--accent-glow)' : 'transparent',
                        color: urgency === level ? 'var(--accent)' : 'var(--text-secondary)',
                        textTransform: 'capitalize', fontWeight: 600, fontSize: '13px',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="form-group form-full-width">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label" htmlFor="description" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Detailed Description
                  </label>
                  {voiceSupported && (
                    <button
                      type="button"
                      onClick={toggleVoiceDescription}
                      title={isRecording ? 'Stop recording' : 'Dictate description'}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isRecording ? '#ff3b30' : 'var(--border)'}`,
                        background: isRecording ? 'rgba(255,59,48,0.08)' : 'transparent',
                        color: isRecording ? '#ff3b30' : 'var(--text-muted)',
                        fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {isRecording ? <MicOff size={13} /> : <Mic size={13} />}
                      {isRecording ? 'Stop' : 'Dictate'}
                      {isRecording && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff3b30', animation: 'pulse 1s ease-in-out infinite' }} />}
                    </button>
                  )}
                </div>
                <textarea
                  id="description"
                  required
                  rows={6}
                  placeholder="Describe your issue with full details so that peers can write a precise, fully-vetted answer."
                  className="form-input"
                  style={{ width: '100%', padding: '16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font)', resize: 'vertical', lineHeight: 1.5 }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* File Attachment */}
              <div className="form-group form-full-width">
                <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Upload Screenshots or Supporting Documents (Optional)
                </label>
                <div className="portal-upload-zone" onClick={() => document.getElementById('file-attach')?.click()}>
                  <input type="file" id="file-attach" style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,.pdf" />
                  <div className="portal-upload-icon"><Upload size={20} /></div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {cvFileName ? cvFileName : 'Click to upload files'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Supports JPEG, PNG, PDF up to 5MB</div>
                </div>
              </div>

              {/* Caution Note */}
              <div className="form-full-width" style={{ display: 'flex', gap: '10px', background: 'rgba(255,59,48,0.04)', border: '1px solid rgba(255,59,48,0.1)', borderRadius: 'var(--radius)', padding: '16px', marginTop: '8px' }}>
                <ShieldAlert size={20} style={{ color: '#ff3b30', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Important Notice:</strong> Please check the current <Link to="/faq" style={{ color: 'var(--accent)' }}>FAQ Page</Link> first to confirm this issue is not already answered.
                </span>
              </div>

              {submitError && (
                <div className="form-full-width" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)', borderRadius: 'var(--radius)', color: '#ff3b30', fontSize: '13.5px' }}>
                  <ShieldAlert size={16} />
                  {submitError}
                </div>
              )}

              <div className="portal-form-actions form-full-width">
                <Link to="/" className="btn-secondary">Cancel</Link>
                <button type="submit" disabled={isSubmitting || !title.trim() || !description.trim()} className="btn-accent">
                  {isSubmitting ? 'Submitting...' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
