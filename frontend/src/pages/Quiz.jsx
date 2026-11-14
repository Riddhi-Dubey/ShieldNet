import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Award, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { getQuizQuestions, submitQuiz, extractErrorMessage } from '../services/api';
import { LoadingState, ErrorState } from '../components/LoadingState';

const TOPICS = [
  { id: 'general', label: 'All-Round Cyber Defense' },
  { id: 'banking', label: 'Banking & UPI Payment Frauds' },
  { id: 'phishing', label: 'Phishing Links & Social Media' },
  { id: 'impersonation', label: 'Digital Arrest & Police Impersonation' },
];

export const Quiz = () => {
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [questions, setQuestions] = useState([]);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);

  const fetchQuestions = async (topicId) => {
    setLoading(true);
    setError(null);
    setSubmissionResult(null);
    setCurrentAnswers({});

    try {
      const data = await getQuizQuestions(topicId);
      // Handles data format as { questions: [...] } or direct array
      const qList = Array.isArray(data) ? data : data?.questions || [];
      setQuestions(qList);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(selectedTopic);
  }, [selectedTopic]);

  const handleSelectOption = (questionId, optionIndex) => {
    if (submissionResult) return; // Prevent changing after submit
    setCurrentAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(currentAnswers).length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await submitQuiz({
        topic: selectedTopic,
        answers: currentAnswers,
      });
      setSubmissionResult(res);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmissionResult(null);
    setCurrentAnswers({});
    fetchQuestions(selectedTopic);
  };

  const allAnswered = questions.length > 0 && Object.keys(currentAnswers).length === questions.length;

  return (
    <div className="page-wrapper" style={{ maxWidth: '880px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <HelpCircle size={18} style={{ color: 'var(--primary-accent)' }} />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            ShieldNet Citizen Education
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)' }}>
          Scam Awareness & Defensive Readiness Quiz
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Test your ability to spot social engineering lures, fake police summons, and fraudulent investment apps.
        </p>
      </div>

      {/* Topic Switcher Bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTopic(t.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: selectedTopic === t.id ? '1px solid var(--primary-accent)' : '1px solid var(--border-color)',
              backgroundColor: selectedTopic === t.id ? 'var(--primary-accent-light)' : 'var(--bg-secondary)',
              color: selectedTopic === t.id ? 'var(--primary-accent)' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Could Not Load Questions"
          message={error}
          onRetry={() => fetchQuestions(selectedTopic)}
        />
      )}

      {/* Loading */}
      {loading ? (
        <LoadingState message="Fetching awareness questions from /api/quiz/questions..." />
      ) : questions.length > 0 ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Submission Score Banner if result available */}
          {submissionResult && (
            <div
              className="cyber-card cyber-card-glow"
              style={{
                borderColor: 'var(--primary-accent)',
                backgroundColor: '#0F1A30',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    color: 'var(--primary-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Award size={30} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Assessment Complete: {submissionResult.score ?? 0} / {submissionResult.total ?? questions.length}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {submissionResult.feedback || (submissionResult.score === questions.length ? 'Excellent defensive instincts! You are well-guarded against modern scams.' : 'Good effort! Review the verified explanations below to harden your cyber defenses.')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
                style={{ fontSize: '13px' }}
              >
                <RefreshCw size={14} />
                Try Another Round
              </button>
            </div>
          )}

          {/* Question Cards */}
          {questions.map((q, qIndex) => {
            const qId = q.id || `q_${qIndex}`;
            const selectedOpt = currentAnswers[qId];
            const answerFeedback = submissionResult?.details?.[qId] || submissionResult?.answers?.[qId];
            const isCorrect = answerFeedback ? answerFeedback.correct : null;
            const correctOptionIndex = answerFeedback ? answerFeedback.correct_option ?? q.correct_option : null;

            return (
              <div
                key={qId}
                className="cyber-card"
                style={{
                  borderLeft: submissionResult
                    ? isCorrect
                      ? '4px solid var(--accent-green)'
                      : '4px solid var(--accent-critical)'
                    : '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-accent)', fontFamily: 'var(--font-mono)' }}>
                    QUESTION {qIndex + 1} OF {questions.length}
                  </span>
                  {submissionResult && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: isCorrect ? 'var(--accent-green)' : 'var(--accent-critical)',
                      }}
                    >
                      {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.4 }}>
                  {q.question}
                </h3>

                {/* Multiple Choice Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(q.options || []).map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    const isRevealedCorrect = submissionResult && correctOptionIndex === optIdx;

                    let optBg = 'var(--bg-secondary)';
                    let optBorder = 'var(--border-color)';
                    let optColor = 'var(--text-primary)';

                    if (submissionResult) {
                      if (isRevealedCorrect) {
                        optBg = 'var(--accent-green-bg)';
                        optBorder = 'var(--accent-green)';
                        optColor = 'var(--accent-green)';
                      } else if (isSelected && !isCorrect) {
                        optBg = 'var(--accent-critical-bg)';
                        optBorder = 'var(--accent-critical)';
                        optColor = 'var(--accent-critical)';
                      }
                    } else if (isSelected) {
                      optBg = 'var(--primary-accent-light)';
                      optBorder = 'var(--primary-accent)';
                    }

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(qId, optIdx)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: optBg,
                          border: `1px solid ${optBorder}`,
                          color: optColor,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: submissionResult ? 'default' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: `1px solid ${optBorder}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            flexShrink: 0,
                          }}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span style={{ flex: 1 }}>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation on Submission */}
                {submissionResult && (q.explanation || answerFeedback?.explanation) && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                      Security Explanation:
                    </strong>
                    {answerFeedback?.explanation || q.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit Actions */}
          {!submissionResult && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={submitting || !allAnswered}
                className="btn btn-primary"
                style={{ minWidth: '200px', padding: '12px 24px' }}
              >
                {submitting ? 'Evaluating Answers...' : allAnswered ? 'Submit Quiz Answers' : `Select All Answers (${Object.keys(currentAnswers).length}/${questions.length})`}
              </button>
            </div>
          )}
        </form>
      ) : null}
    </div>
  );
};

export default Quiz;
