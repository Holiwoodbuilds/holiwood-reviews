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
  const [pendingImages, setPendingImages] = useState({}); // { reviewId: File[] }

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
          <button type="submit" style={styles.button}>Log in</button>
          {loginError && <p style={{ color: 'red' }}>{loginError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <h1>Holiwood Reviews — Dashboard</h1>
      <div style={styles.tabs}>
        {['pending', 'approved', 'rejected'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...styles.tabButton, ...(tab === t ? styles.tabActive : {}) }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p>Loading...</p>}
      {!loading && reviews.length === 0 && <p>No {tab} reviews.</p>}

      {reviews.map((r) => (
        <div key={r.id} style={styles.card}>
          <div style={styles.cardHeader}>
            <strong>{r.customer_name}</strong> — {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
            <span style={styles.muted}> · {r.product_title || r.product_id}</span>
          </div>

          {editingId === r.id ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              style={styles.textarea}
            />
          ) : (
            <p>{r.review_text}</p>
          )}

          {r.image_urls && r.image_urls.length > 0 && (
            <div style={styles.imageRow}>
              {r.image_urls.map((url) => (
                <div key={url} style={{ position: 'relative' }}>
                  <img src={url} alt="" style={styles.thumb} />
                  <button
                    onClick={() => updateReview(r.id, { remove_image_url: url })}
                    style={styles.removeImgBtn}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={styles.actions}>
            {editingId === r.id ? (
              <>
                <button onClick={() => updateReview(r.id, { review_text: editText })} style={styles.button}>
                  Save text
                </button>
                <button onClick={() => setEditingId(null)} style={styles.buttonGhost}>
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setEditingId(r.id);
                  setEditText(r.review_text);
                }}
                style={styles.buttonGhost}
              >
                Edit text
              </button>
            )}

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                setPendingImages((prev) => ({ ...prev, [r.id]: Array.from(e.target.files) }))
              }
              style={{ maxWidth: 180 }}
            />
            <button onClick={() => handleAddImages(r.id)} style={styles.buttonGhost}>
              Upload photos
            </button>

            {tab !== 'approved' && (
              <button onClick={() => updateReview(r.id, { status: 'approved' })} style={styles.buttonApprove}>
                Approve & Publish
              </button>
            )}
            {tab !== 'rejected' && (
              <button onClick={() => updateReview(r.id, { status: 'rejected' })} style={styles.buttonReject}>
                Reject
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  loginWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' },
  loginBox: { display: 'flex', flexDirection: 'column', gap: 10, width: 280 },
  input: { padding: 10, fontSize: 14 },
  wrap: { maxWidth: 800, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tabButton: { padding: '8px 16px', border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer', borderRadius: 6 },
  tabActive: { background: '#222', color: '#fff' },
  card: { border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 },
  cardHeader: { marginBottom: 8 },
  muted: { color: '#888', fontSize: 13 },
  textarea: { width: '100%', minHeight: 80, padding: 8, fontSize: 14 },
  imageRow: { display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  thumb: { width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #ccc' },
  removeImgBtn: { position: 'absolute', top: -6, right: -6, background: '#c00', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer' },
  actions: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' },
  button: { padding: '8px 14px', background: '#222', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  buttonGhost: { padding: '8px 14px', background: '#fff', border: '1px solid #999', borderRadius: 6, cursor: 'pointer' },
  buttonApprove: { padding: '8px 14px', background: '#1a7f37', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  buttonReject: { padding: '8px 14px', background: '#b3261e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
};
