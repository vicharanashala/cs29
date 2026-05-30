import apiClient from './client';

export const getAllFaqs = () => apiClient.get('/api/faqs');
export const getTopFaqs = () => apiClient.get('/api/faqs/top');
export const chat = (query: string) => apiClient.post('/api/chat', { query });
export const incrementView = (id: string) => apiClient.patch(`/api/faqs/${id}/view`);
