import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Nav, Footer } from "./components/Layout";
import { ButtonLink } from "./components/ui";
import { useAuth } from "./lib/auth";
import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";

import Home from "./pages/Home";

const Tracks = lazy(() => import("./pages/Tracks"));
const TrackDetail = lazy(() => import("./pages/TrackDetail"));
const Mentors = lazy(() => import("./pages/Mentors"));
const Admissions = lazy(() => import("./pages/Admissions"));
const About = lazy(() => import("./pages/About"));
const Verify = lazy(() => import("./pages/Verify"));
const CertificatePage = lazy(() => import("./pages/CertificatePage"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Login = lazy(() => import("./pages/Login"));
const Apply = lazy(() => import("./pages/Apply"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-plum" />
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Loading</p>
      </div>
    </div>
  );
}

function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { student, ready, isAdmin } = useAuth();
  const location = useLocation();
  if (!ready) return <PageLoader />;
  if (!student) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (admin && !isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("KR8 Academy runtime error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="shell flex min-h-[70vh] flex-col items-center justify-center text-center">
          <p className="eyebrow">Something broke</p>
          <h1 className="display display-lg mt-3">That wasn’t meant to happen.</h1>
          <p className="lede mt-3 max-w-md">
            An unexpected error interrupted this page. Your account data is safe — try again.
          </p>
          <div className="mt-6 flex gap-2">
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload the page
            </button>
            <ButtonLink to="/" variant="ghost">Back home</ButtonLink>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-full focus:bg-magenta-fill focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tracks" element={<Tracks />} />
            <Route path="/tracks/:slug" element={<TrackDetail />} />
            <Route path="/mentors" element={<Mentors />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/about" element={<About />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify/:identifier" element={<Verify />} />
            <Route path="/certificate/:code" element={<CertificatePage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/apply" element={<Apply />} />
            {/* Stable deep links for kr8digitals.com — /register?door=skill · /register?door=academic */}
            <Route path="/register" element={<Apply />} />
            <Route
              path="/dashboard/*"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/*"
              element={
                <RequireAuth admin>
                  <Admin />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <SiteFooterGate />
    </ErrorBoundary>
  );
}

/* Dashboard and admin manage their own vertical rhythm, but still keep the footer. */
function SiteFooterGate() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) return null;
  return <Footer />;
}
