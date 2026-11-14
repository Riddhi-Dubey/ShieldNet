import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  ShieldAlert, 
  Sparkles, 
  AlertTriangle, 
  RefreshCw, 
  Lock,
  Loader2
} from 'lucide-react';
import { sendChatMessage, extractErrorMessage } from '../services/api';

const SUGGESTED_QUESTIONS = [
  "Someone sent me a QR code saying they will send me money. Is it safe to scan?",
  "A caller claims to be from FedEx with an illegal parcel in my name. What should I do?",
  "I received a job offer offering ₹5000/day for liking YouTube videos. Is it genuine?",
  "How can I quickly freeze my bank account after a cyber fraud?",
];

export const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your ScamShield AI Safety Assistant. You can ask me about suspicious phone calls, payment requests, job lures, or how to react to suspected online fraud. Remember: I will never ask you for your OTP, PIN, password, or bank card details.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatBottomRef = useRef(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = typeof textToSend === 'string' ? textToSend : input;
    if (!query.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Build history for backend
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage({
        message: query.trim(),
        history: historyPayload,
      });

      const assistantMsg = {
        role: 'assistant',
        content: res.reply || res.response || res.message || "I evaluated your scenario. Always proceed with extreme caution and never transfer funds or share verification OTPs.",
        topic: res.query_topic,
        source: res.source_attribution,
        actions: res.recommended_actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '880px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: '600px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Bot size={18} style={{ color: 'var(--primary-accent)' }} />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ScamShield Interactive Assistant
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            AI Cyber Safety Advisor
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--accent-warning)',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 600,
            }}
          >
            <Lock size={12} />
            <span>Never share passwords, PINs, or OTPs</span>
          </div>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div
        className="cyber-card"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          padding: '20px',
          backgroundColor: '#0D1527',
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      color: 'var(--primary-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={18} />
                  </div>
                )}

                <div>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: isUser ? '#0284C7' : '#172033',
                      border: isUser ? 'none' : '1px solid var(--border-color)',
                      color: '#F8FAFC',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {!isUser && msg.topic && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-accent)', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                          {msg.topic}
                        </span>
                        {msg.source && (
                          <span style={{ fontSize: '10.5px', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>
                            Source: {msg.source}
                          </span>
                        )}
                      </div>
                    )}
                    {msg.content}

                    {!isUser && msg.actions && msg.actions.length > 0 && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Recommended Safe Actions:
                        </div>
                        <ul style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {msg.actions.map((act, aIdx) => (
                            <li key={aIdx}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: isUser ? 'right' : 'left', fontFamily: 'var(--font-mono)' }}>
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      backgroundColor: '#1E293B',
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start', alignItems: 'center' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--primary-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Analyzing threat scenario & formulating defensive advice...
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(248, 113, 113, 0.12)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                color: 'var(--accent-critical)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggested Queries Chips */}
        {messages.length < 4 && (
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Suggested cybersecurity questions:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  style={{
                    backgroundColor: '#111827',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    borderRadius: '16px',
                    padding: '5px 12px',
                    fontSize: '11px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          style={{ display: 'flex', gap: '10px', marginTop: '16px' }}
        >
          <input
            type="text"
            className="form-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a suspicious call, link, UPI prompt, or fraud incident..."
            disabled={loading}
            style={{ borderRadius: 'var(--radius-md)' }}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary"
            style={{ padding: '0 20px', borderRadius: 'var(--radius-md)' }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
