import { useState } from 'react';

function Register({ onClose, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Înregistrare eșuată');
      }

      setSuccess('Cont creat cu succes! Vă rugăm să vă autentificați.');
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="auth-title">Înregistrare</h2>
        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label>Nume de utilizator</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Parolă</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">Utilizator</option>
              <option value="editor">Editor</option>
              <option value="jurnalist">Jurnalist</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Se procesează...' : 'Creează cont'}
          </button>
        </form>
        <p className="auth-link">
          Ai deja cont? <button onClick={onSwitchToLogin}>Autentifică-te aici</button>
        </p>
      </div>
    </div>
  );
}

export default Register;
