import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableBlock({ id, block, index, updateBlock, removeBlock, canSort, canEditContent }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    gap: '10px',
    marginBottom: '1rem',
    alignItems: 'flex-start',
    background: '#fff',
    zIndex: transform ? 1 : 0,
    position: 'relative'
  };

  return (
    <div ref={setNodeRef} style={style}>
      {canSort && (
        <button 
          type="button" 
          {...attributes} 
          {...listeners} 
          style={{ cursor: 'grab', padding: '0.5rem', background: '#eee', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ☰
        </button>
      )}
      {block.type === 'paragraph' ? (
        <textarea
          value={block.value}
          onChange={(e) => updateBlock(index, e.target.value)}
          disabled={!canEditContent}
          style={{ flex: 1, minHeight: '100px', padding: '0.5rem', fontFamily: 'inherit', fontSize: '1rem', lineHeight: '1.5', backgroundColor: !canEditContent ? '#f9f9f9' : '#fff' }}
          placeholder="Scrie paragraf..."
        />
      ) : (
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={block.value}
            onChange={(e) => updateBlock(index, e.target.value)}
            disabled={!canEditContent}
            style={{ width: '100%', padding: '0.5rem', fontFamily: 'inherit', backgroundColor: !canEditContent ? '#f9f9f9' : '#fff' }}
            placeholder="URL Imagine inline"
          />
          {block.value && <img src={block.value} alt="inline" style={{ maxWidth: '100%', marginTop: '10px', maxHeight: '200px', objectFit: 'cover' }} />}
        </div>
      )}
      {canEditContent && (
        <button onClick={() => removeBlock(index)} style={{ padding: '0.5rem', background: '#ffcdd2', border: 'none', color: '#c62828', cursor: 'pointer', borderRadius: '4px' }}>
          Șterge
        </button>
      )}
    </div>
  );
}

function ArticleDetail({ article, user, onUpdate }) {
  const [journalistsList, setJournalistsList] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editJ1, setEditJ1] = useState("");
  const [editJ2, setEditJ2] = useState("");
  const [editStatus, setEditStatus] = useState("started");
  const [editImage, setEditImage] = useState("");
  
  // Now editContent holds an array of blocks
  const [editBlocks, setEditBlocks] = useState([]);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newCommentPos, setNewCommentPos] = useState(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [showComments, setShowComments] = useState(true);

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
      setEditImage(article.image || "");
      
      if (Array.isArray(article.content)) {
        setEditBlocks(article.content.map(b => b.id ? b : { ...b, id: crypto.randomUUID() }));
      } else if (typeof article.content === 'string') {
        try {
          const parsed = JSON.parse(article.content);
          setEditBlocks((Array.isArray(parsed) ? parsed : [{ type: 'paragraph', value: article.content }]).map(b => b.id ? b : { ...b, id: crypto.randomUUID() }));
        } catch {
          setEditBlocks([{ type: 'paragraph', value: article.content, id: crypto.randomUUID() }]);
        }
      } else {
        setEditBlocks([]);
      }
      setIsEditing(false); // reset on article change
      
      // Fetch comments for article
      fetch(`http://localhost:3000/api/articles/${article.id}/comments`)
        .then(res => res.json())
        .then(data => setComments(data))
        .catch(console.error);
    }
  }, [article]);

  if (!article) return null;

  const handleSave = () => {
    fetch(`http://localhost:3000/api/articles/${article.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: isEditor ? editTitle : article.title,
        journalist1Id: isEditor ? (editJ1 ? parseInt(editJ1) : null) : article.journalist1Id,
        journalist2Id: isEditor ? (editJ2 ? parseInt(editJ2) : null) : article.journalist2Id,
        status: isEditor ? editStatus : article.status,
        content: editBlocks,
        image: editImage
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
  const isJournalist = user?.role === 'jurnalist' || user?.role === 'journalist';
  const canEdit = isEditor || isJournalist;

  // Format assigned journalists
  const assigned = [];
  if (article.journalist1Username) assigned.push(article.journalist1Username);
  if (article.journalist2Username) assigned.push(article.journalist2Username);

  // Block management functions
  const addBlock = (type) => {
    setEditBlocks([...editBlocks, { id: crypto.randomUUID(), type, value: '' }]);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setEditBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateBlock = (index, value) => {
    const newBlocks = [...editBlocks];
    newBlocks[index].value = value;
    setEditBlocks(newBlocks);
  };

  const removeBlock = (index) => {
    const newBlocks = editBlocks.filter((_, i) => i !== index);
    setEditBlocks(newBlocks);
  };

  const handleContentClick = (e) => {
    // Only editor who created the article can add comments
    if (isEditor && article.author === user?.username && !isEditing && showComments) {
      // Prevent click if we are clicking inside an existing comment or new comment box
      if (e.target.closest('.comment-marker') || e.target.closest('.new-comment-box')) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const topPercent = ((e.clientY - rect.top) / rect.height) * 100;
      const leftPercent = ((e.clientX - rect.left) / rect.width) * 100;
      
      setNewCommentPos({ top: topPercent, left: leftPercent });
      setNewCommentText("");
    }
  };

  const handleSaveComment = () => {
    if (!newCommentText.trim()) return;
    fetch(`http://localhost:3000/api/articles/${article.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newCommentText,
        topPercent: newCommentPos.top,
        leftPercent: newCommentPos.left,
        author: user.username
      })
    })
    .then(res => res.json())
    .then(() => {
      setNewCommentPos(null);
      setNewCommentText("");
      // refetch comments
      return fetch(`http://localhost:3000/api/articles/${article.id}/comments`);
    })
    .then(res => res.json())
    .then(data => setComments(data))
    .catch(console.error);
  };

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

      {canEdit && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>
              {isEditor ? 'Controale Editor' : 'Controale Jurnalist'}
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="auth-trigger-btn" onClick={() => setShowComments(!showComments)}>
                {showComments ? 'Ascunde Comentarii' : 'Arată Comentarii'}
              </button>
              <button className="auth-trigger-btn" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                {isEditing ? 'Salvează' : 'Editează Articol'}
              </button>
              {isEditor && (
                <button className="auth-trigger-btn" style={{ background: '#f44336', color: 'white' }} onClick={handleDelete}>
                  Șterge
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="detail-header">
        {isEditing && isEditor ? (
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
        
        {assigned.length > 0 && (!isEditing || !isEditor) && (
          <div className="detail-meta" style={{ marginTop: '0.5rem', color: '#666', fontWeight: 'bold' }}>
            <span>Jurnaliști asignați: {assigned.join(', ')}</span>
          </div>
        )}

        {isEditing && isEditor && (
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

      {/* Cover Image */}
      {isEditing && isJournalist ? (
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Imagine Principală (Cover):</label>
          <input 
            type="text" 
            value={editImage} 
            onChange={(e) => setEditImage(e.target.value)} 
            style={{ width: '100%', padding: '0.5rem', fontFamily: 'inherit' }}
            placeholder="URL Imagine Cover"
          />
        </div>
      ) : (
        article.image && <img src={article.image} alt={article.title} className="detail-image" />
      )}

      {/* Content Blocks */}
      <div 
        className="detail-content detail-content-container"
        onClick={handleContentClick}
      >
        {!isEditing && showComments && comments && comments.map(c => (
          <div 
            key={c.Id} 
            className="comment-marker" 
            style={{ top: `${c.TopPercent}%`, left: `${c.LeftPercent}%` }}
          >
            !
            <div className="comment-bubble">
              <strong>{c.Author}:</strong> {c.Content}
            </div>
          </div>
        ))}
        
        {!isEditing && newCommentPos && (
          <div 
            className="new-comment-box" 
            style={{ top: `${newCommentPos.top}%`, left: `${newCommentPos.left}%` }}
            onClick={e => e.stopPropagation()}
          >
            <textarea 
              value={newCommentText} 
              onChange={e => setNewCommentText(e.target.value)} 
              placeholder="Adaugă un comentariu..."
              autoFocus
            />
            <div className="new-comment-actions">
              <button className="btn-cancel" onClick={(e) => { e.stopPropagation(); setNewCommentPos(null); }}>Anulează</button>
              <button className="btn-save" onClick={(e) => { e.stopPropagation(); handleSaveComment(); }}>Salvează</button>
            </div>
          </div>
        )}

        {isEditing && (isJournalist || isEditor) ? (
          <div className="blocks-editor">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={editBlocks.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {editBlocks.map((block, i) => (
                  <SortableBlock 
                    key={block.id} 
                    id={block.id} 
                    block={block} 
                    index={i} 
                    updateBlock={updateBlock} 
                    removeBlock={removeBlock}
                    canSort={isEditor}
                    canEditContent={isJournalist}
                  />
                ))}
              </SortableContext>
            </DndContext>
            
            {isJournalist && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button onClick={() => addBlock('paragraph')} style={{ padding: '0.5rem 1rem', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Adaugă Paragraf</button>
                <button onClick={() => addBlock('image')} style={{ padding: '0.5rem 1rem', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Adaugă Imagine</button>
              </div>
            )}
          </div>
        ) : (
          (Array.isArray(article.content) ? article.content : []).map((block, i) => {
            if (block.type === 'paragraph') {
              // Split by newlines just in case they pasted multiple paragraphs in one block
              const lines = block.value.split('\n\n');
              return lines.map((line, j) => (
                <p key={`${i}-${j}`} className={(i === 0 && j === 0) ? "drop-cap" : ""}>
                  {line}
                </p>
              ));
            } else if (block.type === 'image') {
              return <img key={i} src={block.value} alt="Inline article image" className="detail-image" style={{ margin: '2rem 0' }} />;
            }
            return null;
          })
        )}
      </div>
    </div>
  );
}

export default ArticleDetail;
