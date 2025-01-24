import { useState } from "react";
import { X, Send, Bot, Loader } from "lucide-react";
interface Props {
  onClose: () => void;
}
export const AIChatbot = ({
  onClose
}: Props) => {
  const [messages, setMessages] = useState([{
    id: 1,
    type: "bot",
    content: "Hi! I'm your AI assistant. How can I help you today?",
    timestamp: new Date().toISOString()
  }]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputValue,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    // Simulate AI response
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        type: "bot",
        content: "I understand you need help. Let me search through our knowledge base to find the most relevant information.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000);
  };
  return <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-medium">AI Assistant</h3>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
              <p className="text-sm">{message.content}</p>
              <span className="text-xs mt-1 block opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>)}
        {isLoading && <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <Loader className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          </div>}
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSend()} placeholder="Type your message..." className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" />
          <button onClick={handleSend} disabled={!inputValue.trim() || isLoading} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          <button className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200">
            Reset password
          </button>
          <button className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200">
            Billing issue
          </button>
        </div>
      </div>
    </div>;
};