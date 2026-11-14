import axios from 'axios';

// Base URL configuration using Vite environment variables or relative proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45 seconds to accommodate cloud free-tier cold starts
});

// Automatic retry interceptor for handling Render free-tier cold start wakeups
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    const isColdStart =
      error.code === 'ECONNABORTED' ||
      !error.response ||
      [502, 503, 504].includes(error.response?.status);

    const currentRetry = config.__retryCount || 0;
    if (isColdStart && currentRetry < 2) {
      config.__retryCount = currentRetry + 1;
      // Wait 2.5s before retry to allow cloud instance to complete boot
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

// Helper to format detailed backend error messages
export const extractErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred.';

  if (error.code === 'ECONNABORTED' || (!error.response && error.message?.includes('timeout'))) {
    return 'Cloud server is warming up from standby (Render free-tier cold start). Please wait 20-30 seconds and try again.';
  }

  if (error.response) {
    const { status, data } = error.response;
    
    // FastAPI validation error formatting
    if (status === 422 && Array.isArray(data?.detail)) {
      return data.detail.map((err) => `${err.loc?.join('.') || 'field'}: ${err.msg}`).join(', ');
    }

    if (data?.detail) {
      return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }

    if (data?.message) {
      return data.message;
    }

    if (status === 502 || status === 503 || status === 504) {
      return 'Cloud service is currently waking up or completing deployment. Please wait 15 seconds and refresh.';
    }

    if (status === 404) {
      return 'Requested resource or intelligence record was not found.';
    }

    return `Server returned error (${status}): ${error.response.statusText || 'Request failed'}`;
  }

  if (error.request) {
    return 'Connecting to backend service... If this is the initial load, the free-tier server is spinning up from cold-sleep (approx 30s).';
  }

  return error.message || 'Network request failed.';
};

// ==================== API ENDPOINTS ====================

// System Health
export const getHealth = async () => {
  const response = await apiClient.get('/api/health');
  return response.data;
};

// Dashboard
export const getDashboardStats = async () => {
  const response = await apiClient.get('/api/dashboard/stats');
  return response.data;
};

// Investigation Search
export const searchEntities = async ({ query, type = 'auto' }) => {
  const response = await apiClient.post('/api/search', {
    identifier: query,
    query,
    entity_type: type?.toUpperCase() || 'AUTO',
    type,
    max_hops: 2,
  });
  return response.data;
};

// Entity Details & Relationships
export const getEntityDetails = async (entityId) => {
  const response = await apiClient.get(`/api/entities/${encodeURIComponent(entityId)}`);
  return response.data;
};

export const getEntityConnections = async (entityId) => {
  const response = await apiClient.get(`/api/entities/${encodeURIComponent(entityId)}/connections`);
  return response.data;
};

export const getEntityGraph = async (entityId) => {
  const response = await apiClient.get(`/api/entities/${encodeURIComponent(entityId)}/graph`);
  return response.data;
};

// Network Intelligence
export const getNetworkOverview = async () => {
  const response = await apiClient.get('/api/network/overview');
  return response.data;
};

export const getNetworkClusters = async () => {
  const response = await apiClient.get('/api/network/clusters');
  return response.data;
};

// Message & URL Threat Checkers
export const analyseMessage = async (messageText, consentForLlm = false) => {
  const response = await apiClient.post('/api/analyse/message', { 
    message: messageText,
    consent_for_llm: consentForLlm 
  });
  return response.data;
};

export const analyseUrl = async (url, consentForLlm = false) => {
  const response = await apiClient.post('/api/analyse/url', { 
    url,
    consent_for_llm: consentForLlm 
  });
  return response.data;
};

// Client-side instant plain-text report downloader
export const downloadAnalysisReport = (reportText, filename = 'shieldnet_analysis_report.txt') => {
  if (!reportText) return;
  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// AI Safety Assistant Chat
export const sendChatMessage = async ({ message, history = [] }) => {
  const response = await apiClient.post('/api/chat', { message, history });
  return response.data;
};

// Scam Awareness Quiz
export const getQuizQuestions = async (topic = 'general') => {
  const response = await apiClient.get('/api/quiz/questions', { params: { topic } });
  return response.data;
};

export const submitQuiz = async ({ answers, topic = 'general' }) => {
  const response = await apiClient.post('/api/quiz/submit', { answers, topic });
  return response.data;
};

// Incident Reporting & Consent Gate
export const previewReport = async (reportData) => {
  const rawId =
    reportData.phoneNumber ||
    reportData.url ||
    reportData.upiId ||
    reportData.email ||
    reportData.raw_identifier ||
    'CITIZEN_INCIDENT';

  const scamType = (reportData.scam_type || reportData.category || 'OTHER_CYBER_FRAUD')
    .replace(/\s*\/\s*/g, '_')
    .replace(/\s+/g, '_')
    .toUpperCase();

  const payload = {
    ...reportData,
    raw_identifier: rawId,
    scam_type: scamType,
    description: reportData.description || 'Suspicious incident report.',
  };

  const response = await apiClient.post('/api/reports/preview', payload);
  return response.data;
};

export const submitReport = async (reportData) => {
  let consentId = reportData.consent_id;

  // If user granted consent but no consent_id is provided, create the server-side consent record first
  if (reportData.consent_given && !consentId) {
    try {
      const consentRes = await apiClient.post('/api/consent', {
        purpose: 'SCAM_REPORTING',
        destination: 'SCAMTRACE_INTELLIGENCE',
        data_scope: 'SANITIZED_INDICATORS',
        consent_version: '1.0',
      });
      consentId = consentRes.data?.consent_id;
    } catch (e) {
      console.warn('Consent pre-creation notice:', e);
    }
  }

  const rawId =
    reportData.phoneNumber ||
    reportData.url ||
    reportData.upiId ||
    reportData.email ||
    reportData.raw_identifier ||
    'CITIZEN_INCIDENT';

  const scamType = (reportData.scam_type || reportData.category || 'OTHER_CYBER_FRAUD')
    .replace(/\s*\/\s*/g, '_')
    .replace(/\s+/g, '_')
    .toUpperCase();

  const payload = {
    ...reportData,
    consent_id: consentId,
    raw_identifier: rawId,
    scam_type: scamType,
    description: reportData.description,
  };

  const response = await apiClient.post('/api/reports', payload);
  return response.data;
};

// Datasets Management
export const uploadDataset = async (formData, onProgress) => {
  if (formData instanceof FormData && !formData.has('dataset_name')) {
    const classification = formData.get('classification') || 'Custom_Threat_Intel';
    formData.append('dataset_name', classification);
  }

  const response = await apiClient.post('/api/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
  return response.data;
};

export const getDatasetsStatus = async () => {
  const response = await apiClient.get('/api/datasets/status');
  return response.data;
};

// Threat Analytics
export const getAnalyticsSummary = async () => {
  const response = await apiClient.get('/api/analytics/summary');
  return response.data;
};

// Threat Timeline
export const getEntityTimeline = async (entityId) => {
  const response = await apiClient.get(`/api/entities/${encodeURIComponent(entityId)}/timeline`);
  return response.data;
};

// Case Management
export const getCases = async (params = {}) => {
  const response = await apiClient.get('/api/cases', { params });
  return response.data;
};

export const createCase = async (caseData) => {
  const response = await apiClient.post('/api/cases', caseData);
  return response.data;
};

export const getCaseDetail = async (caseId) => {
  const response = await apiClient.get(`/api/cases/${encodeURIComponent(caseId)}`);
  return response.data;
};

export const updateCase = async (caseId, updateData) => {
  const response = await apiClient.put(`/api/cases/${encodeURIComponent(caseId)}`, updateData);
  return response.data;
};

export const deleteCase = async (caseId) => {
  const response = await apiClient.delete(`/api/cases/${encodeURIComponent(caseId)}`);
  return response.data;
};

export const attachCaseEntity = async (caseId, { entity_id, notes = '' }) => {
  const response = await apiClient.post(`/api/cases/${encodeURIComponent(caseId)}/entities`, {
    entity_id,
    notes,
  });
  return response.data;
};

export const removeCaseEntity = async (caseId, entityId) => {
  const response = await apiClient.delete(
    `/api/cases/${encodeURIComponent(caseId)}/entities/${encodeURIComponent(entityId)}`
  );
  return response.data;
};

export const addCaseNote = async (caseId, { content, author = 'Investigator' }) => {
  const response = await apiClient.post(`/api/cases/${encodeURIComponent(caseId)}/notes`, {
    content,
    author,
  });
  return response.data;
};

export const exportCaseDossier = async (caseId, format = 'markdown') => {
  const response = await apiClient.get(`/api/cases/${encodeURIComponent(caseId)}/export`, {
    params: { format },
    responseType: 'text',
  });
  return response.data;
};

export default {
  getHealth,
  getDashboardStats,
  searchEntities,
  getEntityDetails,
  getEntityConnections,
  getEntityGraph,
  getEntityTimeline,
  getNetworkOverview,
  getNetworkClusters,
  analyseMessage,
  analyseUrl,
  sendChatMessage,
  getQuizQuestions,
  submitQuiz,
  previewReport,
  submitReport,
  uploadDataset,
  getDatasetsStatus,
  getAnalyticsSummary,
  getCases,
  createCase,
  getCaseDetail,
  updateCase,
  deleteCase,
  attachCaseEntity,
  removeCaseEntity,
  addCaseNote,
  exportCaseDossier,
  extractErrorMessage,
};
