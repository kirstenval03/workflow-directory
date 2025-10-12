import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast";

// Public Pages
import WorkflowDirectory from './Pages/WorkflowDirectory.js';
import AIReportForm from './Pages/AIReportForm.js';
import AIReportResults from './Pages/AIReportResults';
import AIWorkflowsTable from './Pages/aia-workflows-table.js';
import JobBoard from './Pages/JobBoard.jsx';
import Login from './Pages/Login.js';

// Admin Pages
import AdminDashboard from './Pages/AdminDashboard.jsx';
import AdminApplications from './Pages/AdminApplications.jsx'; // 👈 import this
import ProtectedRoute from './Components/ProtectedRoute.jsx';
import AdminCandidates from "./Pages/AdminCandidates.jsx";

export default function App() {
  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<WorkflowDirectory />} />
        <Route path="/AI-report" element={<AIReportForm />} />
        <Route path="/AI-report-results/:id" element={<AIReportResults />} />
        <Route path="/aia-workflows-table" element={<AIWorkflowsTable />} />
        <Route path="/jobs" element={<JobBoard />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Routes (Protected by Supabase Auth) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* 👇 New Applications Route */}
        <Route
          path="/admin/applications"
          element={
            <ProtectedRoute>
              <AdminApplications />
            </ProtectedRoute>
          }
        />

        
        <Route
          path="/admin/candidates"
          element={
            <ProtectedRoute>
              <AdminCandidates />
            </ProtectedRoute>
          }
        />

      </Routes>

      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
    </Router>
  );
}
