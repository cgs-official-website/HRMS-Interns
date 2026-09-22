import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { usePermissions } from "./hooks/usePermissions";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import History from "./pages/History";
import Profile from "./pages/Profile";
import ChatWidget from "./components/ChatWidget";
import TeamHub from "./pages/TeamHub";
import ProjectManagement from "./pages/ProjectManagement";
import TaskManagement from "./pages/TaskManagement";
import LandingPage from "./pages/LandingPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import PurchaseOrganization from "./pages/PurchaseOrganization";
import ClientChat from "./pages/ClientChat";
import ProjectCalendar from "./pages/ProjectCalendar";
import EnvironmentalSetup from "./modules/environmentalSetup/pages/EnvironmentalSetup";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import InactiveAccount from "./pages/InactiveAccount";

// Protected Route Component for general logged-in users
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  if (currentUser.status === "inactive") {
    return <Navigate to="/inactive" replace />;
  }
  
  return children;
}

// Protected Route Component for Admin only
function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  const { hasAnyAdminPermission, loading } = usePermissions();
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  if (currentUser.status === "inactive") {
    return <Navigate to="/inactive" replace />;
  }
  
  if (loading) return null;
  
  if (!hasAnyAdminPermission()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Protected Route Component for Super Admin only
function SuperAdminRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  if (currentUser.status === "inactive") {
    return <Navigate to="/inactive" replace />;
  }
  
  if (currentUser.role !== "superadmin") {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Public Route Component (Login, Register) - redirects logged-in users
function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  const { hasAnyAdminPermission, loading } = usePermissions();
  
  if (currentUser) {
    if (loading) return null;
    
    if (currentUser.status === "inactive") {
      return <Navigate to="/inactive" replace />;
    }
    
    if (currentUser.role === "superadmin") {
      return <Navigate to="/superadmin" replace />;
    }
    if (hasAnyAdminPermission()) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function RootRouteRedirect() {
  const { currentUser } = useAuth();
  const { hasAnyAdminPermission, loading } = usePermissions();

  if (!currentUser) return <Navigate to="/" replace />;
  if (loading) return null;

  if (currentUser.status === "inactive") return <Navigate to="/inactive" replace />;
  if (currentUser.role === "superadmin") return <Navigate to="/superadmin" replace />;
  if (hasAnyAdminPermission()) return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { currentUser } = useAuth();

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/reset-password" 
          element={<ResetPassword />} 
        />
        <Route 
          path="/purchase" 
          element={
            <PublicRoute>
              <PurchaseOrganization />
            </PublicRoute>
          } 
        />
        <Route 
          path="/:companySlug/login" 
          element={<Login />} 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route 
          path="/:companySlug/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route 
          path="/client-chat/:linkToken" 
          element={<ClientChat />} 
        />
        
        <Route 
          path="/inactive" 
          element={<InactiveAccount />} 
        />

        {/* User Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <History />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/team-hub" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TeamHub />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/project-management" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProjectManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/project-calendar" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProjectCalendar />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/task-management" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TaskManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        {/* Admin Protected Routes */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/environmental-setup" 
          element={
            <AdminRoute>
              <DashboardLayout>
                <EnvironmentalSetup />
              </DashboardLayout>
            </AdminRoute>
          } 
        />

        {/* Super Admin Protected Routes */}
        <Route 
          path="/superadmin" 
          element={
            <SuperAdminRoute>
              <DashboardLayout>
                <SuperAdminDashboard />
              </DashboardLayout>
            </SuperAdminRoute>
          } 
        />

        {/* Catch-all redirect / 404 */}
        <Route 
          path="*" 
          element={<NotFound />}
        />
      </Routes>
      {/* Zuna AI Chatbot — floating on all pages */}
      <ChatWidget />
    </div>
  );
}
