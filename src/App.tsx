import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { Search, Loader2, Newspaper, ArrowRight } from 'lucide-react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are NewsLens, an intelligent news research assistant built to help users explore any topic through current news and articles.

When a user provides a topic, you will:
1. Acknowledge the topic briefly and naturally
2. Give a concise 2-3 sentence summary of what is currently happening with that topic
3. Highlight 2-3 key angles or perspectives being covered (e.g. political, economic, social)
4. Note any notable trends, controversies, or developments worth knowing
5. End with 1-2 suggested related topics the user might want to explore next

Tone: Informative, neutral, and conversational. Never robotic or overly formal.
Format: Use clean markdown with short headers and bullet points where helpful. Keep it scannable.
Length: Medium — enough to be useful, short enough to read in under a minute.

You are NOT a chatbot for general conversation. If the user asks something unrelated to news or topic research, politely redirect them back to news exploration.

Always stay neutral and present multiple perspectives when topics are politically or socially sensitive.`;

export default function App() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setGroundingChunks([]);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Research this topic: ${topic}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
        },
      });

      setResult(response.text || 'No results found.');
      
      // Extract grounding chunks for sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        setGroundingChunks(chunks);
      }
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

        {/* Results Area */}
        {result && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="prose prose-blue max-w-none prose-headings:font-semibold prose-a:text-blue-600 hover:prose-a:text-blue-500">
              <Markdown>{result}</Markdown>
            </div>
            
            {/* Sources */}
            {groundingChunks.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  Sources
                </h3>
                <ul className="space-y-3">
                  {groundingChunks.map((chunk, index) => {
                    if (chunk.web?.uri && chunk.web?.title) {
                      return (
                        <li key={index} className="flex items-start">
                          <ArrowRight className="w-4 h-4 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                          <a
                            href={chunk.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-600 hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {chunk.web.title}
                          </a>
                        </li>
                      );
                    }
                    return null;
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
