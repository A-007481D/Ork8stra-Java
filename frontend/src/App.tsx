import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './Login';
import Register from './Register';
import OAuthCallback from './OAuthCallback';
import Dashboard from './Dashboard';
import Projects from './Projects';
import JoinOrg from './JoinOrg';
import AcceptInvitation from './pages/AcceptInvitation';
import LandingPage from './components/LandingPage';
import Layout from './Layout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/join/org/:token" element={<JoinOrg />} />
            <Route path="/invite/accept" element={<AcceptInvitation />} />
            <Route path="/auth/github/callback" element={<OAuthCallback />} />

            {/* Protected Routes wrapped in Layout */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/applications" element={<div className="p-10 text-center text-text-muted">Applications View Coming Soon</div>} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
