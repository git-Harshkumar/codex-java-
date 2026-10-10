import React, { useState } from 'react';
import NeoCard from '../components/NeoCard';
import NeoButton from '../components/NeoButton';

const VisualizerView = () => {
  const [topic, setTopic] = useState('');
  const [diagram, setDiagram] = useState('');

  const renderDiagram = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/ai/diagram?topic=${encodeURIComponent(topic || 'Binary Tree')}`);
      const data = await response.json();
      setDiagram(data.data || 'No diagram returned.');
    } catch (error) {
      setDiagram('Failed to fetch diagram: ' + error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontSize: '32px' }}>ALGORITHM VISUALIZER 👁️</h1>
      
      <div style={{ display: 'flex', gap: '15px' }}>
        <input 
          type="text" 
          className="neo-input" 
          style={{ flexGrow: 1 }}
          placeholder="Enter data structure (e.g. Binary Tree, Stack)..."
          value={topic}
          onChange={e => setTopic(e.target.value)}
        />
        <NeoButton action onClick={renderDiagram}>GENERATE DIAGRAM</NeoButton>
      </div>

      <NeoCard bg="#FFFFFF" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <pre style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>
          {diagram}
        </pre>
      </NeoCard>
    </div>
  );
};

export default VisualizerView;
