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
  Loader2,
  CheckCircle2
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
      content: "Hello! I am your ShieldNet Cyber Safety Advisor. You can ask me about suspicious phone calls, payment requests, job offers, or how to respond to suspected online fraud. Remember: I will never ask you for your OTP, PIN, password, or banking credentials.",
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
    <div className="page-wrapper" style={{ maxWidth: '920px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', minHeight: '620px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Bot size={18} style={{ color: 'var(--primary-accent)' }} />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            ShieldNet Interactive Safety Advisor
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-heading)' }}>
            AI Cyber Safety Advisor
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              color: 'var(--accent-warning)',
              backgroundColor: 'var(--accent-warning-bg)',
              border: '1px solid rgba(180, 83, 9, 0.25)',
              padding: '4px 12px',
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
          padding: '24px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
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
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-accent-light)',
                      color: 'var(--primary-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <Bot size={19} />
                  </div>
                )}

                <div>
                  <div
                    style={{
                      padding: '13px 18px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: isUser ? 'var(--primary-accent-light)' : '#FFFFFF',
                      border: isUser ? '1px solid rgba(57, 127, 120, 0.3)' : '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                      boxShadow: isUser ? 'var(--shadow-xs)' : 'var(--shadow-card)',
                    }}
                  >
                    {!isUser && msg.topic && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-accent)', backgroundColor: 'var(--primary-accent-light)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(57, 127, 120, 0.2)' }}>
                          {msg.topic}
                        </span>
                        {msg.source && (
                          <span style={{ fontSize: '11px', color: 'var(--secondary-accent)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            Source: {msg.source}
                          </span>
                        )}
                      </div>
                    )}

                    {msg.content}

                    {!isUser && msg.actions && msg.actions.length > 0 && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-accent)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Recommended Safe Actions:
                        </div>
                        <ul style={{ paddingLeft: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {msg.actions.map((act, aIdx) => (
                            <li key={aIdx}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px', textAlign: isUser ? 'right' : 'left', fontFamily: 'var(--font-mono)' }}>
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid var(--border-color)',
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
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-accent-light)',
                  color: 'var(--primary-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Analyzing threat query & formulating verified cybersecurity guidance...
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '11px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-critical-bg)',
                border: '1px solid rgba(185, 28, 28, 0.25)',
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
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Suggested cybersecurity questions:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    borderRadius: '16px',
                    padding: '6px 13px',
                    fontSize: '11.5px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-accent)';
                    e.currentTarget.style.color = 'var(--text-heading)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
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
            placeholder="Ask about a suspicious message, bank call, UPI link, or scam incident..."
            disabled={loading}
            style={{ borderRadius: 'var(--radius-md)' }}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary"
            style={{ padding: '0 22px', borderRadius: 'var(--radius-md)' }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
