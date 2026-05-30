import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { FaqPage } from './pages/FaqPage';
import { ChatPage } from './pages/ChatPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { RaiseIssuePage } from './pages/RaiseIssuePage';
import { TrackIssuesPage } from './pages/TrackIssuesPage';
import { ResolveQuestionPage } from './pages/ResolveQuestionPage';
import AdminPage from './pages/AdminPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const faqRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faq',
  component: FaqPage,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat',
  component: ChatPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignupPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});

const raiseIssueRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/raise-issue',
  component: RaiseIssuePage,
});

const trackIssuesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/track-issues',
  component: TrackIssuesPage,
});

const resolveQuestionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/resolve-question',
  component: ResolveQuestionPage,
});

const announcementsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/announcements',
  component: AnnouncementsPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  faqRoute,
  chatRoute,
  loginRoute,
  signupRoute,
  forgotPasswordRoute,
  profileRoute,
  raiseIssueRoute,
  trackIssuesRoute,
  resolveQuestionRoute,
  announcementsRoute,
  adminRoute,
]);

export const router = createRouter({ routeTree });

// Register your router for maximum type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
