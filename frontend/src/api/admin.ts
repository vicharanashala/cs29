import apiClient from './client';

export const getPending = () => apiClient.get('/api/admin/pending');
export const approvePending = (id: string) => apiClient.patch(`/api/admin/pending/${id}/approve`);
export const rejectPending = (id: string) => apiClient.patch(`/api/admin/pending/${id}/reject`);
export const getStats = () => apiClient.get('/api/admin/stats');
export const getAdminFaqs = () => apiClient.get('/api/admin/faqs');
export const createFaq = (data: { question: string; answer: string; category: string }) =>
  apiClient.post('/api/admin/faqs', data);
export const deleteFaq = (id: string) => apiClient.delete(`/api/admin/faqs/${id}`);
