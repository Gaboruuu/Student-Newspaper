import { useState, useEffect } from "react";
import ArticleListItem from "../components/ArticleListItem";
import ArticleDetail from "../components/ArticleDetail";

function Home({ user }) {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchArticles = () => {
    let url = 'http://localhost:3000/api/articles';
    if (user) {
      url += `?username=${encodeURIComponent(user.username)}&role=${encodeURIComponent(user.role)}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setArticles(data);
        if (data.length > 0 && !selectedArticle) {
          setSelectedArticle(data[0]);
        } else if (selectedArticle) {
          const updated = data.find(a => a.id === selectedArticle.id);
          if (updated) setSelectedArticle(updated);
          else setSelectedArticle(data.length > 0 ? data[0] : null);
        } else if (data.length === 0) {
          setSelectedArticle(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching articles:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchArticles();
  }, [user]);

  const handleCreateArticle = () => {
    fetch('http://localhost:3000/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Articol Nou',
        author: user.username
      })
    })
    .then(res => res.json())
    .then(() => fetchArticles())
    .catch(console.error);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '500px' }}>
        <h2>Se încarcă articolele...</h2>
      </div>
    );
  }

  return (
    <main className="split-layout">
      {/* Left Pane: Article List */}
      <aside className="article-list-pane">
        {user?.role === 'editor' && (
          <div style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
            <button className="auth-trigger-btn" style={{ width: '100%' }} onClick={handleCreateArticle}>
              + Creează Articol
            </button>
          </div>
        )}
        {articles.map((article) => (
          <ArticleListItem
            key={article.id}
            article={article}
            isSelected={selectedArticle?.id === article.id}
            onSelect={setSelectedArticle}
          />
        ))}
      </aside>

      {/* Right Pane: Article Detail */}
      <section className="article-detail-pane">
        <ArticleDetail article={selectedArticle} user={user} onUpdate={fetchArticles} />
      </section>
    </main>
  );
}

export default Home;
