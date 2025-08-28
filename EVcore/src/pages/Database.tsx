import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PilotManagement } from '../features/databaseManagement/pages/PilotManagement';

const Database: React.FC = () => {
  return (
    <div className="w-full h-full">
      <Routes>
        <Route path="/" element={<Navigate to="/database-management/pilot" replace />} />
        <Route path="/pilot" element={<PilotManagement />} />
        {/* Add other database management routes here */}
      </Routes>
    </div>
  );
};

export default Database;