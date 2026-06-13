import { useState, useEffect } from "react";
import ArticleListItem from "../components/ArticleListItem";
import ArticleDetail from "../components/ArticleDetail";

function Home() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data);
        if (data.length > 0) {
          setSelectedArticle(data[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching articles:", err);
        setLoading(false);
      });
  }, []);

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
        <ArticleDetail article={selectedArticle} />
      </section>
    </main>
  );
}

export default Home;
