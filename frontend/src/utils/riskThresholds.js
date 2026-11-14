/**
 * Risk Thresholds Configuration
 * Centralized single source of truth for scam probability bands and risk styling.
 * 
 * Initial probability bands:
 * - Low risk: below 30%
 * - Medium risk: 30% to below 70%
 * - High risk: 70% to 100%
 */

export const MESSAGE_PROBABILITY_THRESHOLDS = {
  LOW_MAX: 30.0,       // Strictly below 30% -> Low risk
  MEDIUM_MAX: 70.0,    // 30% to below 70% -> Medium risk
  // 70% and above -> High risk
};

/**
 * Derives the risk level, styling, color, and icon consistently from the
 * TF-IDF + Calibrated Logistic Regression model's scam probability.
 * 
 * @param {number|null|undefined} mlProbability - Calibrated probability (0-100)
 * @returns {Object} Complete risk assessment presentation metadata
 */
export const getMessageRiskAssessment = (mlProbability) => {
  if (mlProbability === undefined || mlProbability === null || isNaN(mlProbability) || mlProbability === '') {
    return {
      level: 'UNABLE_TO_ASSESS',
      label: 'Unable to Assess',
      displayVerdict: 'Unable to assess: Model probability unavailable',
      badgeClass: 'badge-neutral',
      colorVar: 'var(--text-muted)',
      bgVar: 'var(--bg-secondary)',
      borderColor: 'var(--border-color)',
      iconName: 'HelpCircle',
      isAssessed: false,
      formattedProbability: null,
      description: 'The statistical machine learning model was unable to compute a probability score for this input.',
    };
  }

  const prob = Number(mlProbability);

  if (prob < MESSAGE_PROBABILITY_THRESHOLDS.LOW_MAX) {
    return {
      level: 'LOW',
      label: 'Low Risk',
      displayVerdict: 'LOW RISK ASSESSMENT',
      badgeClass: 'badge-low',
      colorVar: 'var(--accent-green)',
      bgVar: 'var(--accent-green-bg)',
      borderColor: 'rgba(21, 128, 61, 0.25)',
      iconName: 'ShieldCheck',
      isAssessed: true,
      formattedProbability: `${prob.toFixed(1)}%`,
      description: `${prob.toFixed(1)}% scam probability (Low risk band: below 30%). Does not guarantee safety.`,
    };
  } else if (prob < MESSAGE_PROBABILITY_THRESHOLDS.MEDIUM_MAX) {
    return {
      level: 'MEDIUM',
      label: 'Medium Risk',
      displayVerdict: 'MEDIUM RISK ASSESSMENT',
      badgeClass: 'badge-medium',
      colorVar: 'var(--accent-warning)',
      bgVar: 'var(--accent-warning-bg)',
      borderColor: 'rgba(180, 83, 9, 0.25)',
      iconName: 'AlertTriangle',
      isAssessed: true,
      formattedProbability: `${prob.toFixed(1)}%`,
      description: `${prob.toFixed(1)}% scam probability (Medium risk band: 30% to below 70%). Proceed with caution.`,
    };
  } else {
    return {
      level: 'HIGH',
      label: 'High Risk',
      displayVerdict: 'HIGH RISK ASSESSMENT',
      badgeClass: 'badge-critical',
      colorVar: 'var(--accent-critical)',
      bgVar: 'var(--accent-critical-bg)',
      borderColor: 'rgba(185, 28, 28, 0.25)',
      iconName: 'AlertOctagon',
      isAssessed: true,
      formattedProbability: `${prob.toFixed(1)}%`,
      description: `${prob.toFixed(1)}% scam probability (High risk band: 70% to 100%). Elevated scam likelihood.`,
    };
  }
};
