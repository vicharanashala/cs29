import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach a fresh Firebase ID token to every request (auto-refreshed by Firebase SDK)
apiClient.interceptors.request.use(async (config) => {
  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    const token = await firebaseUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 sign out and redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await signOut(auth);
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
