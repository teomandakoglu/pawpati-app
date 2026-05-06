import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import QuizPage from './pages/QuizPage';
import Dashboard from './pages/Dashboard';
import HealthCalendar from './pages/HealthCalendar';
import SubscriptionPage from './pages/SubscriptionPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/health-calendar" element={<HealthCalendar />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
      </Routes>
    </BrowserRouter>
  );
}
