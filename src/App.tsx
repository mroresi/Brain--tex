import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AllNotebooks from './pages/AllNotebooks';
import NotebookDetail from './pages/NotebookDetail';
import Collections from './pages/Collections';
import PromptsLibrary from './pages/PromptsLibrary';
import Artifacts from './pages/Artifacts';
import Automation from './pages/Automation';
import MergeNotebooks from './pages/MergeNotebooks';
import BulkImport from './pages/BulkImport';
import CaptureBridge from './pages/CaptureBridge';
import AllSources from './pages/AllSources';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LogIn } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return <div className="h-screen w-screen bg-[#000000] flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="h-screen w-screen bg-[#000000] flex flex-col items-center justify-center text-white p-6">
        <div className="max-w-md w-full border border-white/20 rounded-xl p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#FF0000] rounded-xl flex items-center justify-center mb-6">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to Braintex</h1>
          <p className="text-white/60 mb-8">Sign in to manage your NotebookLM workflows, sources, and artifacts.</p>
          <button 
            onClick={signInWithGoogle}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-white/90 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ProtectedRoute>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/notebooks" replace />} />
              <Route path="notebooks" element={<AllNotebooks />} />
              <Route path="notebooks/:id" element={<NotebookDetail />} />
              <Route path="sources" element={<AllSources />} />
              <Route path="capture" element={<CaptureBridge />} />
              <Route path="artifacts" element={<Artifacts />} />
              <Route path="collections" element={<Collections />} />
              <Route path="prompts" element={<PromptsLibrary />} />
              <Route path="automation" element={<Automation />} />
              <Route path="merge" element={<MergeNotebooks />} />
              <Route path="bulk-import" element={<BulkImport />} />
              <Route path="*" element={<Navigate to="/notebooks" replace />} />
            </Route>
          </Routes>
        </ProtectedRoute>
      </BrowserRouter>
    </AuthProvider>
  );
}
