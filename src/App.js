import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WorkflowDirectory from './Pages/WorkflowDirectory.js';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WorkflowDirectory />} />
      </Routes>
    </Router>
  );
}
