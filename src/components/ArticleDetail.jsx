function ArticleDetail({ article }) {
  if (!article) return null;

  const paragraphs = article.content.split("\n\n");

  return (
    <div className="detail-article-wrapper animate-fade-in" key={article.id}>
      <header className="detail-header">
        <h1 className="detail-title">{article.title}</h1>
        <div className="detail-meta">
          <span>{article.date}</span>
          <span>•</span>
          <span>de {article.author}</span>
        </div>
      </header>

      <img src={article.image} alt={article.title} className="detail-image" />

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
