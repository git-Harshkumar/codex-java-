import React, { useState } from 'react';
import NeoCard from '../components/NeoCard';
import NeoButton from '../components/NeoButton';
import { api, BASE_URL } from '../api';

const QuizView = ({ user, onQuizComplete }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [numQuestions, setNumQuestions] = useState(5);
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);

  const clearQuiz = () => {
    setTopic('');
    setDifficulty('Beginner');
    setNumQuestions(5);
    setQuiz(null);
    setCurrentQ(0);
    setSelected(null);
    setResult(null);
    setScore(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      startQuiz();
    }
  };

  const startQuiz = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/ai/quiz?topic=${encodeURIComponent(topic || 'DSA')}&difficulty=${encodeURIComponent(difficulty)}&count=${numQuestions}`);
      const data = await response.json();
      setQuiz(data);
      setCurrentQ(0);
      setSelected(null);
      setResult(null);
      setScore(0);
    } catch (error) {
      alert('Could not fetch quiz: ' + error.message);
    }
  };

  const handleSubmit = () => {
    if (!selected) return;
    const correct = quiz.questions[currentQ].correctAnswer;
    const isCorrect = selected === correct;
    if (isCorrect) setScore(s => s + 1);
    setResult({
      isCorrect,
      text: isCorrect
        ? `✓ CORRECT! ${quiz.questions[currentQ].explanation}`
        : `✗ WRONG. The answer is "${correct}".\n${quiz.questions[currentQ].explanation}`,
      color: isCorrect ? '#8FD6B0' : '#FFCDD2'
    });
  };

  const nextQuestion = async () => {
    const isLast = currentQ >= quiz.questions.length - 1;
    if (isLast) {
      // Compute final score including the current answer
      const finalCorrect = result?.isCorrect ? score + 1 : score;
      try {
        await api.recordProgress({
          userId: user?.id || 1,
          topicName: quiz.topic || topic || 'General',
          correctAnswers: finalCorrect,
          totalQuestions: quiz.questions.length,
        });
        if (onQuizComplete) onQuizComplete();
      } catch (e) { /* non-blocking */ }
    }
    setSelected(null);
    setResult(null);
    setCurrentQ(q => q + 1);
  };

  const question = quiz?.questions?.[currentQ];
  const isFinished = quiz && currentQ >= quiz.questions.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontSize: '32px' }}>AI QUIZ SYSTEM 📝</h1>

      <NeoCard bg="#FFFFFF" style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold' }}>Topic</label>
          <input type="text" className="neo-input" placeholder="e.g. Binary Search" value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={handleKeyDown} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold' }}>Questions</label>
          <input type="number" className="neo-input" min="1" max="20" style={{ width: '100px' }} value={numQuestions} onChange={e => setNumQuestions(e.target.value)} onKeyDown={handleKeyDown} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold' }}>Difficulty</label>
          <select className="neo-input" style={{ padding: '12px 16px' }} value={difficulty} onChange={e => setDifficulty(e.target.value)} onKeyDown={handleKeyDown}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <NeoButton action onClick={startQuiz}>START QUIZ →</NeoButton>
          <NeoButton onClick={clearQuiz} style={{ backgroundColor: '#FFCDD2', color: '#1A1A1A' }}>CLEAR</NeoButton>
        </div>
      </NeoCard>

      {isFinished && (
        <NeoCard bg="#F5D876" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900 }}>🎉 QUIZ COMPLETE!</h2>
          <div style={{ fontSize: '48px', fontWeight: 900, margin: '20px 0' }}>{score} / {quiz.questions.length}</div>
          <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>
            {score === quiz.questions.length ? 'Perfect score! 🏆' : score >= quiz.questions.length / 2 ? 'Good job! Keep studying!' : 'Keep practicing — you\'ve got this!'}
          </p>
          <NeoButton onClick={startQuiz}>RETRY QUIZ</NeoButton>
        </NeoCard>
      )}

      {question && !isFinished && (
        <NeoCard bg={result ? result.color : '#C9B8F5'} style={{ maxWidth: '700px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#555', marginBottom: '10px' }}>
            QUESTION {currentQ + 1} / {quiz.questions.length} · SCORE: {score}
          </div>
          <h2 style={{ fontSize: '22px', margin: '0 0 25px' }}>{question.text}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
            {question.options.map(opt => (
              <label key={opt} style={{
                fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                padding: '10px 16px', borderRadius: '12px',
                backgroundColor: selected === opt ? '#1A1A1A' : 'rgba(255,255,255,0.5)',
                color: selected === opt ? 'white' : '#1A1A1A'
              }}>
                <input type="radio" name="quiz" value={opt} onChange={() => !result && setSelected(opt)} checked={selected === opt} style={{ width: '18px', height: '18px' }} />
                {opt}
              </label>
            ))}
          </div>

          {!result && <NeoButton onClick={handleSubmit} disabled={!selected}>SUBMIT ANSWER</NeoButton>}

          {result && (
            <>
              <div style={{ fontWeight: 'bold', fontSize: '15px', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>{result.text}</div>
              {currentQ < quiz.questions.length - 1
                ? <NeoButton action onClick={nextQuestion}>NEXT QUESTION →</NeoButton>
                : <NeoButton action onClick={nextQuestion}>SEE RESULTS →</NeoButton>
              }
            </>
          )}
        </NeoCard>
      )}
    </div>
  );
};

export default QuizView;

