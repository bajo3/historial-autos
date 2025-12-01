import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import VehiclesList from './pages/VehiclesList';
import VehicleDetail from './pages/VehicleDetail';
import QuotesList from './pages/QuotesList';
import SupabasePing from './components/SupabasePing';

const App: React.FC = () => {
  return (
    <Layout>
      <SupabasePing />
      <Routes>
        <Route path="/" element={<Navigate to="/vehicles" replace />} />
        <Route path="/vehicles" element={<VehiclesList />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/quotes" element={<QuotesList />} />
      </Routes>
    </Layout>
  );
};

export default App;
