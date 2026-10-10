import React, { useState } from 'react';
import NeoCard from '../components/NeoCard';
import NeoButton from '../components/NeoButton';
import { api } from '../api';

const ProfileSettingsView = ({ user }) => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('');

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ fontWeight: 'bold', color: '#555' }}>{label}</div>
      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <h1 style={{ fontSize: '32px' }}>PROFILE & SETTINGS ⚙️</h1>

      <div style={{ display: 'flex', gap: '40px' }}>
        
        {/* Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '350px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>USER PROFILE</h2>
          <NeoCard bg="#C9B8F5" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '24px', fontWeight: 900 }}>{(user?.name || 'Student').toUpperCase()}</h3>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{user?.email || 'student@studymate.ai'}</div>
            </div>

            <Row label="Learning Level" value="Intermediate" />
            <Row label="Preferred Languages" value="Java, C++, Python" />
            <Row label="Subjects" value="DSA, Java, DBMS, OS, AI" />

            <NeoButton style={{ marginTop: '10px' }}>EDIT PROFILE</NeoButton>
          </NeoCard>
        </div>

        {/* Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>CONFIGURATION</h2>
          <NeoCard bg="#FFFFFF" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900 }}>APPLICATION SETTINGS</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '20px', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>AI API Key</div>
              <input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter new Gemini API Key..." 
                className="neo-input" 
              />
              
              <div style={{ fontWeight: 'bold' }}>Default Difficulty</div>
              <select className="neo-input" style={{ padding: '8px 16px' }}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <NeoButton 
                action 
                onClick={() => {
                  if (!apiKey.trim()) return;
                  setStatus('Saving...');
                  fetch('http://localhost:8080/api/ai/key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: apiKey })
                  })
                  .then(res => {
                    if (res.ok) {
                      setStatus('✅ Saved! Restarting not required.');
                      setApiKey('');
                    } else throw new Error();
                  })
                  .catch(() => setStatus('❌ Failed to save'));
                }}
              >
                SAVE SETTINGS
              </NeoButton>
              {status && <span style={{ fontWeight: 'bold', fontSize: '14px', color: status.includes('❌') ? '#FF6B6B' : '#8FD6B0' }}>{status}</span>}
            </div>
          </NeoCard>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsView;
