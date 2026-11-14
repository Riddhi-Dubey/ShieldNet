import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Layout & Global Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import EmergencyModal from './components/EmergencyModal';
import PrivacyModal from './components/PrivacyModal';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import MessageChecker from './pages/MessageChecker';
import URLChecker from './pages/URLChecker';
import Chatbot from './pages/Chatbot';
import Quiz from './pages/Quiz';
import ReportForm from './pages/ReportForm';
import InvestigationSearch from './pages/InvestigationSearch';
import NetworkExplorer from './pages/NetworkExplorer';
import EntityInvestigation from './pages/EntityInvestigation';
import Analytics from './pages/Analytics';
import DataSources from './pages/DataSources';
import InvestigationReport from './pages/InvestigationReport';

// Inner layout component to conditionally render Sidebar
const AppContent = ({ onOpenEmergency, onOpenPrivacy }) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="app-container">
      {/* Sidebar rendered for all app modules */}
      {!isLanding && (
        <Sidebar
          onOpenEmergency={onOpenEmergency}
          onOpenPrivacy={onOpenPrivacy}
        />
      )}

      <main className="main-content">
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* ScamShield Modules */}
          <Route path="/shield/message" element={<MessageChecker />} />
          <Route path="/shield/url" element={<URLChecker />} />
          <Route path="/shield/chat" element={<Chatbot />} />
          <Route path="/shield/quiz" element={<Quiz />} />
          <Route path="/shield/report" element={<ReportForm />} />

          {/* ScamTrace Modules */}
          <Route path="/trace/dashboard" element={<Dashboard />} />
          <Route path="/trace/search" element={<InvestigationSearch />} />
          <Route path="/trace/investigate/:id" element={<EntityInvestigation />} />
          <Route path="/trace/network" element={<NetworkExplorer />} />
          <Route path="/trace/analytics" element={<Analytics />} />
          <Route path="/trace/datasets" element={<DataSources />} />
          <Route path="/trace/report/:id" element={<InvestigationReport />} />

          {/* Fallback route */}
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>
    </div>
  );
};

export const App = () => {
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar
          onOpenEmergency={() => setEmergencyOpen(true)}
          onOpenPrivacy={() => setPrivacyOpen(true)}
        />

        <AppContent
          onOpenEmergency={() => setEmergencyOpen(true)}
          onOpenPrivacy={() => setPrivacyOpen(true)}
        />

        {/* Global Modals */}
        <EmergencyModal
          isOpen={emergencyOpen}
          onClose={() => setEmergencyOpen(false)}
        />

        <PrivacyModal
          isOpen={privacyOpen}
          onClose={() => setPrivacyOpen(false)}
        />
      </div>
    </Router>
  );
};

export default App;
