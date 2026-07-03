// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { MessageSelectionProvider } from './context/MessageSelectionContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChatsPage from './pages/ChatsPage';
import GroupsPage from './pages/GroupsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ContactsPage from './pages/ContactsPage';
import StarredMessages from './pages/StarredMessages';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <MessageSelectionProvider>
            <Routes>
              {/* ---- Public Routes ---- */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* ---- Protected Routes ---- */}
              <Route path="/starred" element={
                <ProtectedRoute>
                  <StarredMessages />
                </ProtectedRoute>
              } />
              
              {/* ---- Dashboard with nested routes ---- */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
                <Route index element={<Navigate to="/chats" replace />} />
                <Route path="chats" element={<ChatsPage />} />
                <Route path="chats/:chatId" element={<ChatsPage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="groups/:groupId" element={<GroupsPage />} />
                <Route path="contacts" element={<ContactsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              
              {/* ---- 404 Not Found ---- */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MessageSelectionProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;