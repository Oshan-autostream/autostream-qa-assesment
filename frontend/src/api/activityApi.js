import axios from './axios';

const API_BASE = '/activities';

/**
 * Get recent activities
 */
export const getRecentActivities = (limit = 20, skip = 0, filters = {}) => {
  return axios.get(`${API_BASE}/recent`, {
    params: {
      limit,
      skip,
      ...filters,
    },
  });
};

/**
 * Get activity summary
 */
export const getActivitySummary = () => {
  return axios.get(`${API_BASE}/summary`);
};

/**
 * Get activities for a specific entity
 */
export const getEntityActivities = (entityType, entityId) => {
  return axios.get(`${API_BASE}/entity/${entityType}/${entityId}`);
};

/**
 * Cleanup old activities (admin only)
 */
export const cleanupOldActivities = (daysOld = 90) => {
  return axios.post(`${API_BASE}/cleanup`, { daysOld });
};
