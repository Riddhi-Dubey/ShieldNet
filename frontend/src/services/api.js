import axios from 'axios';

// Base URL configuration using Vite environment variables or relative proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Helper to format detailed backend error messages
export const extractErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred.';

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

    if (status === 503) {
      return 'AI Model or Threat Intelligence Service is currently offline or warming up.';
    }

    if (status === 404) {
      return 'Requested resource or intelligence record was not found.';
    }

    return `Server returned error (${status}): ${error.response.statusText || 'Request failed'}`;
  }

  if (error.request) {
    return 'Unable to connect to backend server. Ensure FastAPI is running on port 8000 or check VITE_API_URL.';
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
export const analyseMessage = async (messageText) => {
  const response = await apiClient.post('/api/analyse/message', { message: messageText });
  return response.data;
};

export const analyseUrl = async (url) => {
  const response = await apiClient.post('/api/analyse/url', { url });
  return response.data;
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

export default {
  getHealth,
  getDashboardStats,
  searchEntities,
  getEntityDetails,
  getEntityConnections,
  getEntityGraph,
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
  extractErrorMessage,
};
