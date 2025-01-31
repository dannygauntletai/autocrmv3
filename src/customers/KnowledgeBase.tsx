import { useState, useEffect } from "react";
import { Book, ArrowRight } from "lucide-react";
import { supabase } from '../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';

interface KBArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  articles: KBArticle[];
}

export const KnowledgeBase = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      
      // Get all categories and their articles
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('kb_categories')
        .select(`
          id,
          name,
          kb_articles (
            id,
            title,
            content,
            tags
          )
        `);

      if (categoriesError) throw categoriesError;

      // Transform the data into our Category interface
      const transformedCategories = categoriesData.map(cat => ({
        id: cat.id,
        name: cat.name,
        articles: (cat.kb_articles || []).map(article => ({
          ...article,
          category: {
            id: cat.id,
            name: cat.name
          }
        }))
      })).filter(cat => cat.articles.length > 0);

      setCategories(transformedCategories);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Knowledge Base</h1>
        <p className="mt-1 text-sm text-gray-500">
          Find answers to common questions and learn how to use our platform
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : selectedArticle ? (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <button
            onClick={() => setSelectedArticle(null)}
            className="mb-4 text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to articles
          </button>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {selectedArticle.title}
          </h2>
          <div className="prose max-w-none">
            <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
          </div>
          {selectedArticle.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {selectedArticle.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Book className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-medium text-gray-900">
                  {category.name}
                </h2>
              </div>
              <ul className="space-y-3">
                {category.articles.map((article) => (
                  <li key={article.id}>
                    <button
                      onClick={() => setSelectedArticle(article)}
                      className="group flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-blue-600"
                    >
                      {article.title}
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};