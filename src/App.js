import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WorkflowDirectory from './Pages/WorkflowDirectory.js';
import AIReportForm from './Pages/AIReportForm.js';
import AIReportResults from './Pages/AIReportResults';
import AIWorkflowsTable from './Pages/aia-workflows-table.js';
import JobBoard from './Pages/JobBoard.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WorkflowDirectory />} />
        <Route path="/AI-report" element={<AIReportForm />} />
        <Route path="/AI-report-results/:id" element={<AIReportResults />} />
        <Route path="/aia-workflows-table" element={<AIWorkflowsTable />} />
        <Route path="/jobs" element={<JobBoard />} />
      </Routes>
    </Router>
  );
}
