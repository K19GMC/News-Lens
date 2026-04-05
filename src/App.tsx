import { useState } from 'react';
import { Search, Loader2, Newspaper, ArrowRight } from 'lucide-react';

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  source: { name: string };
  publishedAt: string;
}

export default function App() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setArticles([]);

    try {
      const newsRes = await fetch(`/api/news?topic=${encodeURIComponent(topic)}`);
      const newsData = await newsRes.json();

      if (newsData.status !== 'ok' || !newsData.articles?.length) {
        throw new Error('No articles found for that topic. Try a different search.');
      }

      const fetchedArticles: Article[] = newsData.articles.filter(
        (a: Article) => a.title && a.title !== '[Removed]'
      );
      setArticles(fetchedArticles);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while researching the topic.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-200">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <Newspaper className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
            NewsLens
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Your intelligent news research assistant. Enter any topic to get a concise, multi-perspective summary of current coverage.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-12 relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Artificial Intelligence regulation, Space exploration, Global economy..."
              className="w-full pl-5 pr-16 py-4 text-lg bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="absolute right-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Search className="w-6 h-6" />
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 mb-8">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {articles.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Latest Articles
            </h2>
            <ul className="space-y-4">
              {articles.map((article, index) => (
                <li key={index} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex gap-4 items-start">
                    {article.urlToImage && (
                      <img
                        src={article.urlToImage}
                        alt=""
                        className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-600">{article.source.name}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{article.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{article.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
