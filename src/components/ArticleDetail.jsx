import { useState, useEffect } from "react";

function ArticleDetail({ article, user, onUpdate }) {
  const [journalistsList, setJournalistsList] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editJ1, setEditJ1] = useState("");
  const [editJ2, setEditJ2] = useState("");
  const [editStatus, setEditStatus] = useState("started");

  useEffect(() => {
    if (user?.role === 'editor') {
      fetch('http://localhost:3000/api/users/journalists')
        .then(res => res.json())
        .then(data => setJournalistsList(data))
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (article) {
      setEditTitle(article.title || "");
      setEditJ1(article.journalist1Id || "");
      setEditJ2(article.journalist2Id || "");
      setEditStatus(article.status || "started");
      setIsEditing(false); // reset on article change
    }
  }, [article]);

  if (!article) return null;

  const paragraphs = (article.content || "").split("\n\n");

  const handleSave = () => {
    fetch(`http://localhost:3000/api/articles/${article.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle,
        journalist1Id: editJ1 ? parseInt(editJ1) : null,
        journalist2Id: editJ2 ? parseInt(editJ2) : null,
        status: editStatus
      })
    })
    .then(res => res.json())
    .then(() => {
      setIsEditing(false);
      if (onUpdate) onUpdate();
    })
    .catch(console.error);
  };

  const handleDelete = () => {
    if (confirm("Sigur doriți să ștergeți acest articol?")) {
      fetch(`http://localhost:3000/api/articles/${article.id}`, {
        method: 'DELETE'
      })
      .then(res => res.json())
      .then(() => {
        setIsEditing(false);
        if (onUpdate) onUpdate();
      })
      .catch(console.error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'finished': return '#4caf50'; // green
      case 'pending': return '#ffeb3b'; // yellow
      default: return '#2196f3'; // blue (started)
    }
  };

  const isEditor = user?.role === 'editor';

  // Format assigned journalists
  const assigned = [];
  if (article.journalist1Username) assigned.push(article.journalist1Username);
  if (article.journalist2Username) assigned.push(article.journalist2Username);

  return (
    <div className="detail-article-wrapper animate-fade-in" key={article.id}>
      
      {/* Status Bar */}
      <div style={{ 
        height: '8px', 
        width: '100%', 
        backgroundColor: getStatusColor(article.status), 
        borderRadius: '4px',
        marginBottom: '1rem',
        transition: 'background-color 0.3s ease'
      }}></div>

      {isEditor && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>Controale Editor</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="auth-trigger-btn" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                {isEditing ? 'Salvează' : 'Editează Articol'}
              </button>
              <button className="auth-trigger-btn" style={{ background: '#f44336', color: 'white' }} onClick={handleDelete}>
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="detail-header">
        {isEditing ? (
          <input 
            type="text" 
            value={editTitle} 
            onChange={(e) => setEditTitle(e.target.value)} 
            style={{ width: '100%', fontSize: '2rem', marginBottom: '1rem', padding: '0.5rem', fontFamily: 'inherit', fontWeight: 'bold' }}
          />
        ) : (
          <h1 className="detail-title">{article.title}</h1>
        )}

        <div className="detail-meta">
          <span>{article.date}</span>
          <span>•</span>
          <span>de {article.author}</span>
        </div>
        
        {assigned.length > 0 && !isEditing && (
          <div className="detail-meta" style={{ marginTop: '0.5rem', color: '#666', fontWeight: 'bold' }}>
            <span>Jurnaliști asignați: {assigned.join(', ')}</span>
          </div>
        )}

        {isEditing && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '10px', background: '#fff', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ width: '100px', fontWeight: 'bold' }}>Jurnalist 1: </label>
              <select value={editJ1} onChange={e => setEditJ1(e.target.value)} style={{ padding: '0.5rem', flex: 1 }}>
                <option value="">Niciunul</option>
                {journalistsList.map(j => (
                  <option key={j.Id} value={j.Id}>{j.Username}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ width: '100px', fontWeight: 'bold' }}>Jurnalist 2: </label>
              <select value={editJ2} onChange={e => setEditJ2(e.target.value)} style={{ padding: '0.5rem', flex: 1 }}>
                <option value="">Niciunul</option>
                {journalistsList.map(j => (
                  <option key={j.Id} value={j.Id}>{j.Username}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ width: '100px', fontWeight: 'bold' }}>Status: </label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ padding: '0.5rem', flex: 1 }}>
                <option value="started">Started</option>
                <option value="pending">Pending</option>
                <option value="finished">Finished</option>
              </select>
            </div>
          </div>
        )}
      </header>

      {article.image && (
        <img src={article.image} alt={article.title} className="detail-image" />
      )}

      <div className="detail-content">
        {paragraphs.map((p, i) => (
          <p key={i} className={i === 0 ? "drop-cap" : ""}>
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

export default ArticleDetail;
