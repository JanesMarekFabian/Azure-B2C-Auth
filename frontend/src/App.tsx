// Main App Component mit React Router
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Login Route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Dashboard Route */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
