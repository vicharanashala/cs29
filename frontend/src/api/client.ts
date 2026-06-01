import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach auth to every request:
//  - Firebase token if a Firebase user is signed in
//  - Plain Authorization: <email> header if logged in via local mock (no Firebase)
apiClient.interceptors.request.use(async (config) => {
  if (auth?.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Prototype local login: carry the email so the backend guard can recognise it
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const { email } = JSON.parse(storedUser);
        if (email) {
          config.headers.Authorization = email as string;
          config.headers['x-user-email'] = email as string;
        }
      } catch (_) {}
    }
  }
  return config;
});

// On 401 clear local auth state and redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_user');
      if (auth) await signOut(auth);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;