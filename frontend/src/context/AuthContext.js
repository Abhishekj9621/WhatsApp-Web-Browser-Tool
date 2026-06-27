// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// ✅ Uses env var — set REACT_APP_API_URL in Cloudflare Pages settings
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API = `${BASE_URL}/api`;

// Attach token to every axios request automatically
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('wa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('wa_token');
    if (!token) { setLoading(false); return; }

    axios.get(`${API}/auth/me`)
      .then(({ data }) => setUser(data))
      .catch(() => localStorage.removeItem('wa_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('wa_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
    localStorage.setItem('wa_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('wa_token');
    setUser(null);
  };

  const createUser = async (payload) => {
    const { data } = await axios.post(`${API}/auth/create-user`, payload);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, needsSetup, login, register, logout, createUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
