function ArticleListItem({ article, isSelected, onSelect }) {
  return (
    <div
      className={`list-item ${isSelected ? "active" : ""}`}
      onClick={() => onSelect(article)}
    >
      <h3 className="list-item-title">{article.title}</h3>
      <div className="list-item-meta">
        <span>{article.date}</span>
        <span>{article.author}</span>
      </div>
      <p className="list-item-excerpt">{article.excerpt}</p>
    </div>
  );
}

export default ArticleListItem;
