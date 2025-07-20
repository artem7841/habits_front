// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AuthVerify from './components/AuthVerify';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HabitsPage from './pages/HabitsPage';


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Защищённые маршруты */}
          <Route element={<PrivateRoute />}>
            <Route path="/habits" element={<HabitsPage />} />
          </Route>
        </Routes>
        <AuthVerify />
      </AuthProvider>
    </Router>
  );
}

export default App;