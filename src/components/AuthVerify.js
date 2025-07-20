// src/components/AuthVerify.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthVerify = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  return null;
};

export default AuthVerify;