import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EvolutionProvider } from './contexts/EvolutionContext';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Campaigns from './pages/Campaigns/Campaigns';
import NewCampaign from './pages/Campaigns/NewCampaign';
import Contacts from './pages/Contacts/Contacts';
import Settings from './pages/Settings/Settings';
import Layout from './components/Layout/Layout';
import NotFound from './pages/NotFound';
import Instances from './pages/Evolution';
import Chat from './pages/Chat';
import ConnectWhatsApp from './pages/ConnectWhatsApp';
import WhatsAppConnections from './pages/WhatsAppConnections';
import Chatbot from './pages/Chatbot';
import CreateAgent from './pages/CreateAgent';

const ProtectedRouteComponent = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <EvolutionProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRouteComponent>
                <Layout />
              </ProtectedRouteComponent>
            }>
              <Route index element={<Dashboard />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="campaigns/new" element={<NewCampaign />} />
              <Route path="instances" element={<ProtectedRouteComponent><Instances /></ProtectedRouteComponent>} />
              <Route path="baileys" element={<ProtectedRouteComponent><ConnectWhatsApp /></ProtectedRouteComponent>} />
              <Route path="contacts" element={<ProtectedRouteComponent><Contacts /></ProtectedRouteComponent>} />
              <Route path="chat" element={<ProtectedRouteComponent><Chat /></ProtectedRouteComponent>} />
              <Route path="settings" element={<Settings />} />
              <Route path="whatsapp/connect" element={<ProtectedRouteComponent><ConnectWhatsApp /></ProtectedRouteComponent>} />
              <Route path="whatsapp/connections" element={<ProtectedRouteComponent><WhatsAppConnections /></ProtectedRouteComponent>} />
              <Route path="chatbot" element={<ProtectedRouteComponent><Chatbot /></ProtectedRouteComponent>} />
              <Route path="criar-robo" element={<ProtectedRouteComponent><CreateAgent /></ProtectedRouteComponent>} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </EvolutionProvider>
    </AuthProvider>
  );
}

export default App;