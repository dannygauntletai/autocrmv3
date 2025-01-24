import { Search, Book, ArrowRight } from "lucide-react";
export const KnowledgeBase = () => {
  const categories = [{
    title: "Getting Started",
    articles: ["Quick Start Guide", "Account Setup", "Basic Navigation"]
  }, {
    title: "Common Issues",
    articles: ["Password Reset", "Login Problems", "Billing Questions"]
  }, {
    title: "Advanced Features",
    articles: ["API Integration", "Custom Workflows", "Team Management"]
  }];
  return <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Knowledge Base</h1>
        <p className="mt-1 text-sm text-gray-500">
          Find answers to common questions and learn how to use our platform
        </p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input type="text" placeholder="Search articles..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category, index) => <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Book className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">
                {category.title}
              </h2>
            </div>
            <ul className="space-y-3">
              {category.articles.map((article, articleIndex) => <li key={articleIndex}>
                  <button className="group flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-blue-600">
                    {article}
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </li>)}
            </ul>
          </div>)}
      </div>
    </div>;
};