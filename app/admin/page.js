'use client';

import { useState, useEffect } from 'react';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminPage() {
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [pendingImages, setPendingImages] = useState({});

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem('admin_token', data.token);
      setToken(data.token);
    } else {
      setLoginError('Incorrect password');
    }
  }

  async function loadReviews() {
    setLoading(true);
    const res = await fetch(`/api/admin/reviews?status=${tab}`, {
      headers: { 'x-admin-token': token },
    });
    const data = await res.json();
    setReviews(data.reviews || []);
    setLoading(false);
  }

  async function updateReview(id, updates) {
    setLoading(true);
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ id, ...updates }),
    });
    setEditingId(null);
    await loadReviews();
  }

  async function handleAddImages(id) {
    const files = pendingImages[id];
    if (!files || files.length === 0) return;
    const images = await Promise.all(
      files.map(async (f) => ({ name: f.name, base64: await fileToBase64(f) }))
    );
    await updateReview(id, { add_images: images });
    setPendingImages((prev) => ({ ...prev, [id]: [] }));
  }

  if (!token) {
    return (
      <div style={styles.loginWrap}>
        <form onSubmit={handleLogin} style={styles.loginBox}>
          <h2>Holiwood Reviews — Admin</h2>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
