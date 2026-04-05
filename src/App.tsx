import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { Search, Loader2, Newspaper, ArrowRight } from 'lucide-react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
const NEWS_API_KEY = (import.meta as any).env.VITE_NEWS_API_KEY || process.env.NEWS_API_KEY;

const SYSTEM_INSTRUCTION = `You are NewsLens, an intelligent news research assistant built to help users explore any topic through current news and articles.

When a user provides a topic and a list of real news articles, you will:
1. Acknowledge the topic briefly and naturally
2. Give a concise 2-3 sentence summary of what is currently happening based on the provided articles
3. Highlight 2-3 key angles or perspectives being covered (e.g. political, economic, social)
4. Note any notable trends, controversies, or developments worth knowing
5. End with 1-2 suggested related topics the user might want to explore next

Tone: Informative, neutral, and conversational. Never robotic or overly formal.
Format: Use clean markdown with short headers and bullet points where helpful. Keep it scannable.
Length: Medium — enough to be useful, short enough to read in under a minute.

You are NOT a chatbot for general conversation. If the user asks something unrelated to news or topic research, politely redirect them back to news exploration.

Always stay neutral and present multiple perspectives when topics are politically or socially sensitive.`;

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
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setArticles([]);

    try {
      // 1. Fetch articles from NewsAPI
      const newsRes = await fetch(`/api/news?topic=${encodeURIComponent(topic)}`);
      const newsData = await newsRes.json();

      if (newsData.status !== 'ok' || !newsData.articles?.length) {
        throw new Error('No articles found for that topic. Try a different search.');
      }

      const fetchedArticles: Article[] = newsData.articles.filter(
        (a: Article) => a.title && a.title !== '[Removed]'
      );
      setArticles(fetchedArticles);

      // 2. Build article context for Gemini
      const articleContext = fetchedArticles
        .slice(0, 8)
        .map((a, i) => `${i + 1}. "${a.title}" — ${a.source.name}. ${a.description || ''}`)
        .join('\n');

      // 3. Send to Gemini for summary
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash-latest',
        contents: `Research this topic: ${topic}\n\nHere are the latest news articles:\n${articleContext}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      setResult(response.text || 'No summary generated.');
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
        {/* Header */}
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

        {/* Search Form */}
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

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 mb-8">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* AI Summary */}
        {result && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="prose prose-blue max-w-none prose-headings:font-semibold prose-a:text-blue-600 hover:prose-a:text-blue-500">
              <Markdown>{result}</Markdown>
            </div>
          </div>
        )}

        {/* Article Cards */}
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
