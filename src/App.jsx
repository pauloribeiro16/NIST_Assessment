import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AssessmentProvider, useAssessment } from './context/AssessmentContext';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import CategoryPage from './pages/CategoryPage';
import FunctionPage from './pages/FunctionPage';
import RoadmapPage from './pages/RoadmapPage';
import NetworkVisualizerPage from './pages/NetworkVisualizerPage';
import CopilotSidebar from './components/CopilotSidebar';
import ProjectSelectionPage from './pages/ProjectSelectionPage';
import LoginPage from './pages/LoginPage';

function ProtectedRoute({ children }) {
  // AUTH DISABLED for Phase 10 Redesign
  return children;
}

function ProjectApp() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const toggleCopilot = () => setIsCopilotOpen(!isCopilotOpen);

  return (
    <div className="relative flex h-screen overflow-hidden w-full">
      {/* Main App Content router (Always Flex-1, Left Menu Inside) */}
      <div className="flex-1 transition-all duration-300 relative overflow-hidden">
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="function/:funcId" element={<FunctionPage />} />
            <Route path="category/:funcId/:categoryId" element={<CategoryPage />} />
            <Route path="visualizer" element={<NetworkVisualizerPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
          </Route>
        </Routes>
      </div>

      {/* Sliding Copilot UI (Strictly on the Right, pushing Main Content) */}
      <div
        className={`shrink-0 bg-white dark:bg-[#0d1117] border-l border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-300 z-50 overflow-hidden ${isCopilotOpen ? 'w-[400px]' : 'w-0'}`}
      >
        <div className="w-[400px] h-full">
          <CopilotSidebar onClose={() => setIsCopilotOpen(false)} />
        </div>
      </div>

      {/* Floating Button to open Copilot if closed (Now on the Right) */}
      {!isCopilotOpen && (
        <button
          onClick={toggleCopilot}
          className="absolute bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AssessmentProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <ProjectSelectionPage />
            </ProtectedRoute>
          } />
          <Route path="/project/:projectId/*" element={
            <ProtectedRoute>
              <ProjectApp />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AssessmentProvider>
    </BrowserRouter>
  );
}
