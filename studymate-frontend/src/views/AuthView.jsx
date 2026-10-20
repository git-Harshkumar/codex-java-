import React, { useState } from 'react';
import NeoCard from '../components/NeoCard';
import NeoButton from '../components/NeoButton';
import { api } from '../api';
import { auth, provider, signInWithPopup } from '../firebase';

/* ── Google "G" SVG logo ──────────────────────────────────────────── */
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.9 2.4 30.3 0 24 0 14.7 0 6.8 5.5 2.9 13.5l7.9 6.1C12.6 13.4 17.9 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
    <path fill="#FBBC05" d="M10.8 28.4A14.7 14.7 0 0 1 9.5 24c0-1.5.3-3 .8-4.4l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.3-6.4z"/>
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.2 1.5-5 2.3-8.4 2.3-6.1 0-11.4-4-13.2-9.4l-8.3 6.4C6.7 42.5 14.8 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

/* ── Divider ──────────────────────────────────────────────────────── */
const Divider = ({ label = 'OR' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
    <div style={{ flex: 1, height: '2px', backgroundColor: '#E0E0E0' }} />
    <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#888' }}>{label}</span>
    <div style={{ flex: 1, height: '2px', backgroundColor: '#E0E0E0' }} />
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   AuthView
══════════════════════════════════════════════════════════════════ */
const AuthView = ({ onLogin }) => {
  const [isLogin, setIsLogin]     = useState(true);
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [gLoading, setGLoading]   = useState(false);

  /* ── Email/password login or register ─────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = isLogin
        ? await api.login(email, password)
        : await api.register(name, email, password);

      if (data.error) {
        setError(data.error);
      } else {
        onLogin(data);
      }
    } catch {
      setError('Cannot connect to the backend. Make sure Spring Boot is running on port 8080.');
    }
    setLoading(false);
  };

  /* ── Google Sign-In ───────────────────────────────────────────── */
  const handleGoogle = async () => {
    setError('');
    setGLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Try to sync with backend; fall back to Firebase profile on error
      let userData = null;
      try {
        const idToken = await firebaseUser.getIdToken();
        userData = await api.googleAuth({
          idToken,
          name:  firebaseUser.displayName,
          email: firebaseUser.email,
          photoUrl: firebaseUser.photoURL,
        });
      } catch (_) { /* backend offline — use Firebase profile directly */ }

      // Safe numeric fallback ID from Firebase UID hash if backend was unreachable
      const fallbackNumericId = Math.abs(
        (firebaseUser.uid || '1').split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
      ) || 1;

      // If backend returned valid user use it, otherwise build from Firebase
      onLogin(userData && !userData.error ? userData : {
        id:      fallbackNumericId,
        firebaseUid: firebaseUser.uid,
        name:    firebaseUser.displayName || 'Student',
        email:   firebaseUser.email,
        photoUrl: firebaseUser.photoURL,
        role:    'GOOGLE',
      });
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked by your browser. Please allow pop-ups for this site.');
      } else {
        setError('Google Sign-In failed: ' + (err.message || 'Unknown error'));
      }
    }
    setGLoading(false);
  };

  /* ── Guest ────────────────────────────────────────────────────── */
  const handleGuest = () =>
    onLogin({ id: 1, name: 'Guest User', email: 'guest@studymate.ai', role: 'GUEST' });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF6EC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* ── Brand ─────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '0px' }}>
          {/* <h1 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-2px' }}>STUDYMATE AI </h1> */}
          {/* <p style={{ fontWeight: 'bold', color: '#555', marginTop: '8px' }}>Your AI-powered learning companion</p> */}
        </div>

        <NeoCard bg="#FFFFFF">
          {/* ── Google Sign-In (primary, shown first) ─────────── */}
          <button
            onClick={handleGoogle}
            disabled={gLoading}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              padding: '14px 20px',
              border: '3px solid #1A1A1A',
              borderRadius: '100px',
              backgroundColor: gLoading ? '#E0E0E0' : '#FFFFFF',
              cursor: gLoading ? 'not-allowed' : 'pointer',
              fontWeight: 900, fontSize: '14px',
              boxShadow: gLoading ? 'none' : '4px 4px 0 #1A1A1A',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!gLoading) { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0 #1A1A1A'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = gLoading ? 'none' : '4px 4px 0 #1A1A1A'; }}
          >
            {gLoading ? (
              <>
                <span style={{ fontSize: 18 }}>⏳</span>
                SIGNING IN WITH GOOGLE...
              </>
            ) : (
              <>
                <GoogleLogo />
                CONTINUE WITH GOOGLE
              </>
            )}
          </button>

          <Divider label="OR SIGN IN WITH EMAIL" />

          {/* ── Login / Register tab toggle ──────────────────── */}
          <div style={{ display: 'flex', marginBottom: '24px', backgroundColor: '#F0EBE0', borderRadius: '100px', padding: '4px' }}>
            {['Login', 'Register'].map(tab => (
              <button key={tab}
                onClick={() => { setIsLogin(tab === 'Login'); setError(''); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s',
                  backgroundColor: (isLogin ? tab === 'Login' : tab === 'Register') ? '#1A1A1A' : 'transparent',
                  color: (isLogin ? tab === 'Login' : tab === 'Register') ? 'white' : '#1A1A1A',
                  fontFamily: 'inherit',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Email/password form ─────────────────────────── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Full Name</label>
                <input type="text" className="neo-input" placeholder="Harsh Kumar"
                  value={name} onChange={e => setName(e.target.value)} required={!isLogin} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Email</label>
              <input type="email" className="neo-input" placeholder="harsh@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Password</label>
              <input type="password" className="neo-input" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {error && (
              <div style={{ backgroundColor: '#FFCDD2', border: '2px solid #1A1A1A', borderRadius: '12px', padding: '12px', fontWeight: 'bold', fontSize: '14px' }}>
                ⚠️ {error}
              </div>
            )}

            <NeoButton action style={{ width: '100%', marginTop: '4px' }} disabled={loading}>
              {loading ? 'LOADING...' : isLogin ? 'LOGIN →' : 'CREATE ACCOUNT →'}
            </NeoButton>
          </form>

          <Divider />

          {/* ── Guest ─────────────────────────────────────── */}
          <button
            onClick={handleGuest}
            style={{
              width: '100%', padding: '14px', borderRadius: '100px',
              border: '3px solid #1A1A1A', backgroundColor: 'transparent',
              fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
              boxShadow: '4px 4px 0 #1A1A1A', transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0 #1A1A1A'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '4px 4px 0 #1A1A1A'; }}
          >
            👤 CONTINUE AS GUEST
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#555' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <span onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{ fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>
              {isLogin ? 'Register here' : 'Login here'}
            </span>
          </p>
        </NeoCard>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#888', fontWeight: 'bold' }}>
          {/* 🚀 Backend must be running on http://localhost:8080 */}
        </p>
      </div>
    </div>
  );
};

export default AuthView;
