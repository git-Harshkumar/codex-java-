import React, { useState, useEffect } from 'react';
import NeoCard from '../components/NeoCard';
import NeoButton from '../components/NeoButton';
import { api } from '../api';

const LANGUAGES = ['Java', 'Python', 'JavaScript', 'C++', 'C', 'TypeScript', 'SQL', 'Kotlin'];

// Auto-detect programming language from code patterns
const detectLanguage = (code) => {
  if (!code.trim()) return 'Auto';
  const c = code;
  
  // C/C++ have very distinct includes
  if (/(#include|cout <<|cin >>|std::|nullptr|template<)/.test(c)) return 'C++';
  if (/(#include|printf\(|scanf\(|void\*|malloc\()/.test(c)) return 'C';
  
  // SQL is mostly uppercase distinct keywords
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|DROP|FROM|WHERE|JOIN)\b/i.test(c) && !/(const|let|var|public|class)/.test(c)) return 'SQL';
  
  // Java requires semicolons for imports/packages. Use multiline to check any line.
  if (/^\s*(import\s+[a-zA-Z0-9_.]+\s*;|package\s+[a-zA-Z0-9_.]+\s*;|public\s+(class|interface|enum|record)|@Override|System\.out\.print)/m.test(c)) return 'Java';
  
  // Python relies on indentation and distinct keywords
  if (/^\s*(def |class |import |from |print\(|elif |lambda |__name__|pass|yield)/m.test(c) && !/[{};]/.test(c)) return 'Python';
  
  // TypeScript has type definitions
  if (/(:\s*(string|number|boolean|any|void|interface |type )|(as\s+[A-Z]|\?\.|!\.|<T>))/.test(c)) return 'TypeScript';
  
  // Kotlin
  if (/(fun |val |var |data class|companion object|:\s*[A-Z]|->\s*[A-Z])/.test(c) && !/function/.test(c)) return 'Kotlin';
  
  // JavaScript
  if (/(const |let |var |=>|console\.log|require\(|module\.exports|document\.)/.test(c)) return 'JavaScript';
  
  return 'Code';
};

const MODES = [
  { 
    key: 'explain',    
    label: 'Explain Code',  
    bg: '#8FD6B0', 
    prompt: `You MUST explain this code by breaking it down into sequential, logical chunks.

Format your response exactly as follows:

### 1. HIGH-LEVEL OVERVIEW
Explain in 2-3 plain-English sentences what the entire code does and its primary goal.

### 2. CHUNK-BY-CHUNK CODE BREAKDOWN
Break down the code into sequential logical chunks (e.g. Method Signature & Variable Setup, Loop Control & Boundary Checks, Core Logic / Calculations, Branching / Updates, Return / Output Handling).

For EACH chunk, format it strictly like this:
#### Chunk [X]: [Descriptive Title of the Chunk]
\`\`\`[language]
[Include the EXACT lines of code belonging to this chunk]
\`\`\`
**What is happening in this chunk:**
- Explain step by step what this specific chunk does in plain English.
- Explain which variables are initialized, accessed, or modified.
- Explain what conditions are being evaluated and how control moves to the next chunk.

### 3. STEP-BY-STEP EXECUTION TRACE
Walk through a concrete example with sample input values (e.g. sample array, numbers, or strings) step by step, showing how variables change in each chunk until completion.

### 4. TIME & SPACE COMPLEXITY
- **Time Complexity:** O(...) with clear justification.
- **Space Complexity:** O(...) auxiliary space explanation.

### 5. BEST PRACTICES & SUMMARY
2-3 tips or observations about this code.` 
  },
  { 
    key: 'bugs',       
    label: 'Find Bugs',     
    bg: '#FFCDD2', 
    prompt: 'Carefully analyze this code for bugs, logic errors, edge cases, and potential runtime issues. Break down the code into chunks, pinpointing the exact problematic lines in code blocks with clear explanations of why they fail and how to fix them.' 
  },
  { 
    key: 'optimize',   
    label: 'Optimize',      
    bg: '#F5D876', 
    prompt: 'Review this code for performance, quality, and best practices. Break down bottlenecks by code chunk, explain what is suboptimal, and provide an improved, optimized version of the code with code snippets and benchmarks.' 
  },
  { 
    key: 'complexity', 
    label: 'Time & Space',  
    bg: '#C9B8F5', 
    prompt: 'Analyze the time and space complexity of this code. Break down each chunk (loops, recursion, allocations). Express complexity using Big-O notation and explain your reasoning clearly.' 
  },
];

const renderContent = (text) => {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const lines = part.slice(3, -3).split('\n');
      const lang = lines[0].trim();
      const code = lines.slice(1).join('\n');
      return (
        <div key={index} style={{ backgroundColor: '#0D1117', color: '#E0E0E0', padding: '16px', borderRadius: '10px', margin: '12px 0', overflowX: 'auto', border: '2px solid #333' }}>
          {lang && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#8FD6B0', fontWeight: 'bold', textTransform: 'uppercase' }}>{lang}</span>
              <span style={{ fontSize: '12px', color: '#888', cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(code)}>Copy</span>
            </div>
          )}
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.6' }}><code>{code}</code></pre>
        </div>
      );
    }
    return (
      <div key={index} style={{ fontSize: '15px', lineHeight: '1.7' }}>
        {part.split('\n').map((line, i) => {
          if (line.startsWith('#### ')) return <p key={i} style={{ margin: '10px 0 4px', fontWeight: 900, fontSize: '14px' }} dangerouslySetInnerHTML={{ __html: line.replace('#### ', '') }} />;
          if (line.startsWith('### ')) return <p key={i} style={{ margin: '12px 0 4px', fontWeight: 900, fontSize: '15px' }} dangerouslySetInnerHTML={{ __html: line.replace('### ', '') }} />;
          if (line.startsWith('## ')) return <p key={i} style={{ margin: '14px 0 4px', fontWeight: 900, fontSize: '15px' }} dangerouslySetInnerHTML={{ __html: line.replace('## ', '') }} />;
          if (line.startsWith('# ')) return <p key={i} style={{ margin: '14px 0 6px', fontWeight: 900, fontSize: '16px' }} dangerouslySetInnerHTML={{ __html: line.replace('# ', '') }} />;
          if (line.trim().startsWith('---')) return <div key={i} style={{ height: '2px', backgroundColor: 'rgba(0,0,0,0.12)', margin: '14px 0' }} />;
          let formatted = line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.1);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;font-weight:bold">$1</code>');
          if (line.trim().startsWith('* ') || line.trim().startsWith('• ') || line.trim().match(/^\d+\.\s/))
            return <div key={i} style={{ marginLeft: '20px', marginBottom: '6px' }} dangerouslySetInnerHTML={{ __html: formatted }} />;
          return <div key={i} style={{ marginBottom: line.trim() === '' ? '0' : '8px' }} dangerouslySetInnerHTML={{ __html: formatted || '<br/>' }} />;
        })}
      </div>
    );
  });
};

const CodeExplainerView = ({ user }) => {
  const [code, setCode] = useState(() => localStorage.getItem('sm_code_text') || '');
  const [detectedLang, setDetectedLang] = useState(() => localStorage.getItem('sm_code_lang') || 'Auto');
  const [activeMode, setActiveMode] = useState(() => localStorage.getItem('sm_code_mode') || null);
  const [result, setResult] = useState(() => {
    try {
      const saved = localStorage.getItem('sm_code_result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Sync code and auto-detect language
  useEffect(() => {
    localStorage.setItem('sm_code_text', code);
    setDetectedLang(detectLanguage(code));
  }, [code]);

  // Sync result
  useEffect(() => {
    if (result) {
      localStorage.setItem('sm_code_result', JSON.stringify(result));
    } else {
      localStorage.removeItem('sm_code_result');
    }
  }, [result]);

  // Sync activeMode
  useEffect(() => {
    if (activeMode) {
      localStorage.setItem('sm_code_mode', activeMode);
    } else {
      localStorage.removeItem('sm_code_mode');
    }
  }, [activeMode]);

  // Sync detectedLang
  useEffect(() => {
    localStorage.setItem('sm_code_lang', detectedLang);
  }, [detectedLang]);

  const handleClear = () => {
    setCode('');
    setResult(null);
    setActiveMode(null);
    localStorage.removeItem('sm_code_text');
    localStorage.removeItem('sm_code_result');
    localStorage.removeItem('sm_code_mode');
  };

  const runAnalysis = async (mode) => {
    if (!code.trim()) return;
    setActiveMode(mode.key);
    setLoading(true);
    setResult(null);

    try {
      const fullPrompt = `You are an expert code analyst. Analyze the following code exactly as written. First, determine the true programming language of the code (the user thinks it might be ${detectedLang}, but verify this yourself). Then, respond entirely in the context of the TRUE language's best practices, idioms, and conventions. Do NOT use emojis.\n\n${mode.prompt}\n\nCode:\n\`\`\`\n${code}\n\`\`\``;

      const response = await fetch('http://localhost:8080/api/ai/raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt })
      });
      const data = await response.text();
      setResult({ title: mode.label, bg: mode.bg, text: data });
    } catch (err) {
      setResult({ title: 'Connection Error', bg: '#FFCDD2', text: 'Could not reach the backend. Make sure Spring Boot is running on port 8080.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '32px' }}>CODE EXPLAINER</h1>

      {/* Input Panel */}
      <NeoCard bg="#FFFFFF">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontWeight: 900 }}>PASTE YOUR CODE</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#555', fontWeight: 'bold' }}>Language:</span>
            <select 
              value={detectedLang}
              onChange={(e) => setDetectedLang(e.target.value)}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                backgroundColor: detectedLang === 'Auto' || detectedLang === 'Code' ? '#E0E0E0' : '#C9B8F5',
                border: '2px solid #1A1A1A',
                fontWeight: 900,
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="Auto">Auto Detect</option>
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
              <option value="Code">Other</option>
            </select>
            {code && (
              <button
                onClick={handleClear}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#FFCDD2',
                  border: '2px solid #1A1A1A',
                  fontWeight: 900,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0 #1A1A1A'
                }}
                title="Clear code and results"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        <textarea
          className="neo-input"
          style={{ width: '100%', height: '240px', fontFamily: 'monospace', fontSize: '14px', borderRadius: '12px', backgroundColor: '#0D1117', color: '#E0E0E0', lineHeight: '1.6', resize: 'vertical' }}
          placeholder={`Paste your code here...`}
          value={code}
          onChange={e => setCode(e.target.value)}
        />

        {/* Mode Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          {MODES.map(mode => (
            <NeoButton
              key={mode.key}
              action={mode.key === activeMode}
              onClick={() => runAnalysis(mode)}
              disabled={loading || !code.trim()}
              style={{
                backgroundColor: activeMode === mode.key ? '#1A1A1A' : mode.bg,
                color: activeMode === mode.key ? 'white' : '#1A1A1A',
                opacity: !code.trim() ? 0.5 : 1,
                cursor: !code.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {loading && activeMode === mode.key ? 'ANALYZING...' : mode.label + ' →'}
            </NeoButton>
          ))}
        </div>
      </NeoCard>

      {/* Result Panel */}
      {loading && (
        <NeoCard bg="#F5F5F5">
          <div style={{ textAlign: 'center', padding: '40px', fontWeight: 900, fontSize: '18px', color: '#888' }}>
            Analyzing your code...
          </div>
        </NeoCard>
      )}

      {result && !loading && (
        <NeoCard bg={result.bg}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 900 }}>{result.title.toUpperCase()}</h2>
            <span
              style={{ fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', padding: '6px 14px', borderRadius: '100px', border: '2px solid #1A1A1A', backgroundColor: 'white' }}
              onClick={() => navigator.clipboard.writeText(result.text)}
            >
              Copy Response
            </span>
          </div>
          {renderContent(result.text)}
        </NeoCard>
      )}
    </div>
  );
};

export default CodeExplainerView;
