import React, { useState } from 'react';
import NeoCard from '../components/NeoCard';
import NeoButton from '../components/NeoButton';
import { api } from '../api';

const AuthView = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      setError('Cannot connect to the backend. Make sure Spring Boot is running on port 8080.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF6EC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-2px' }}>STUDYMATE AI 🧠</h1>
          <p style={{ fontWeight: 'bold', color: '#555', marginTop: '8px' }}>Your AI-powered learning companion</p>
        </div>

        <NeoCard bg="#FFFFFF">
          {/* Tab toggle */}
          <div style={{ display: 'flex', marginBottom: '30px', backgroundColor: '#F0EBE0', borderRadius: '100px', padding: '4px' }}>
            {['Login', 'Register'].map(tab => (
              <button key={tab} onClick={() => { setIsLogin(tab === 'Login'); setError(''); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '100px', border: 'none', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s',
                  backgroundColor: (isLogin ? tab === 'Login' : tab === 'Register') ? '#1A1A1A' : 'transparent',
                  color: (isLogin ? tab === 'Login' : tab === 'Register') ? 'white' : '#1A1A1A',
                }}>
                {tab}
              </button>
            ))}
          </div>

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

            <NeoButton action style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              {loading ? 'LOADING...' : isLogin ? 'LOGIN →' : 'CREATE ACCOUNT →'}
            </NeoButton>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 0' }}>
            <div style={{ flex: 1, height: '2px', backgroundColor: '#E0E0E0' }}></div>
            <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#888' }}>OR</span>
            <div style={{ flex: 1, height: '2px', backgroundColor: '#E0E0E0' }}></div>
          </div>

          <button
            onClick={() => onLogin({ id: 1, name: 'Guest User', email: 'guest@studymate.ai', role: 'GUEST' })}
            style={{
              width: '100%', marginTop: '12px', padding: '14px', borderRadius: '100px',
              border: '3px solid #1A1A1A', backgroundColor: 'transparent',
              fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
              boxShadow: '4px 4px 0 #1A1A1A', transition: 'all 0.2s'
            }}
          >
            👤 CONTINUE AS GUEST (No backend needed)
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#555' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{ fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>
              {isLogin ? 'Register here' : 'Login here'}
            </span>
          </p>
        </NeoCard>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#888', fontWeight: 'bold' }}>
          🚀 Backend must be running on http://localhost:8080
        </p>
      </div>
    </div>
  );
};

export default AuthView;
