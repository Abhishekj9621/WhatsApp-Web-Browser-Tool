// src/context/WaContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const WaContext = createContext(null);

// ✅ Uses env var — set REACT_APP_API_URL in Cloudflare Pages settings
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API = `${BASE_URL}/api`;

export function WaProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [waStatus, setWaStatus] = useState('disconnected');
  const [qrImage, setQrImage] = useState(null);
  const [activeCampaign, setActiveCampaign] = useState(null);

  useEffect(() => {
    const s = io(BASE_URL, { transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('wa:status', ({ status, qr }) => {
      setWaStatus(status);
      if (qr) setQrImage(qr);
      if (status === 'ready' || status === 'authenticated') setQrImage(null);
    });

    s.on('campaign:progress', (data) => {
      setActiveCampaign(data);
    });

    s.on('campaign:done', () => {
      setActiveCampaign(null);
    });

    return () => s.disconnect();
  }, []);

  // ── Contacts ───────────────────────────────────────────
  const getContacts = useCallback(async (params = {}) => {
    const { data } = await axios.get(`${API}/contacts`, { params });
    return data;
  }, []);

  const getGroups = useCallback(async () => {
    const { data } = await axios.get(`${API}/contacts/groups`);
    return data;
  }, []);

  const addContact = useCallback(async (payload) => {
    const { data } = await axios.post(`${API}/contacts`, payload);
    return data;
  }, []);

  const updateContact = useCallback(async (id, payload) => {
    const { data } = await axios.put(`${API}/contacts/${id}`, payload);
    return data;
  }, []);

  const deleteContact = useCallback(async (id) => {
    await axios.delete(`${API}/contacts/${id}`);
  }, []);

  const bulkImport = useCallback(async (contacts) => {
    const { data } = await axios.post(`${API}/contacts/bulk`, { contacts });
    return data;
  }, []);

  // ── Media / Upload ─────────────────────────────────────
  const uploadFile = useCallback(async (file, onProgress) => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await axios.post(`${API}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
    });
    return data;
  }, []);

  const getMediaFiles = useCallback(async () => {
    const { data } = await axios.get(`${API}/upload`);
    return data;
  }, []);

  const deleteMediaFile = useCallback(async (id) => {
    await axios.delete(`${API}/upload/${id}`);
  }, []);

  // ── Campaigns ──────────────────────────────────────────
  const getCampaigns = useCallback(async () => {
    const { data } = await axios.get(`${API}/campaigns`);
    return data;
  }, []);

  const getCampaign = useCallback(async (id) => {
    const { data } = await axios.get(`${API}/campaigns/${id}`);
    return data;
  }, []);

  const sendCampaign = useCallback(async (payload) => {
    const { data } = await axios.post(`${API}/campaigns`, { ...payload, waStatus });
    return data;
  }, [waStatus]);

  const sendSingle = useCallback(async (payload) => {
    const { data } = await axios.post(`${API}/campaigns/send-single`, { ...payload, waStatus });
    return data;
  }, [waStatus]);

  // ── Dashboard stats ───────────────────────────────────
  const getDashboard = useCallback(async () => {
    const { data } = await axios.get(`${API}/dashboard`);
    return data;
  }, []);

  // ── WA control ────────────────────────────────────────
  const logoutWa = useCallback(async () => {
    await axios.post(`${API}/wa/logout`);
  }, []);

  return (
    <WaContext.Provider value={{
      waStatus, qrImage, activeCampaign,
      getContacts, getGroups, addContact, updateContact, deleteContact, bulkImport,
      uploadFile, getMediaFiles, deleteMediaFile,
      getCampaigns, getCampaign, sendCampaign, sendSingle,
      getDashboard, logoutWa,
    }}>
      {children}
    </WaContext.Provider>
  );
}

export const useWa = () => useContext(WaContext);
