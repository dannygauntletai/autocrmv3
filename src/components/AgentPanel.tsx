import { useState, useRef, useEffect, Fragment } from 'react';
import { useAgentInteraction } from '../hooks/useAgentInteraction';
import { Transition } from '@headlessui/react';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';

interface Props {
  ticketId: string;
  onClose?: () => void;
}

export function AgentPanel({ ticketId, onClose }: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isLoading, error, sendMessage } = useAgentInteraction(ticketId);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  return (
    <Transition.Root show={true} as={Fragment}>
      <div className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div 
            className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity lg:bg-transparent" 
            onClick={onClose}
          />
        </Transition.Child>

        {/* Sliding Panel */}
        <Transition.Child
          as={Fragment}
          enter="transform transition ease-in-out duration-300"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transform transition ease-in-out duration-300"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div className="fixed inset-y-0 right-0 w-96 overflow-hidden">
            <div className="flex h-full flex-col bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-2">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Close panel</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
                {messages.map((msg, index) => (
                  <div
                    key={`${msg.timestamp}-${index}`}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900'
                      }`}
                    >
                      <div className={`prose prose-sm ${msg.role === 'user' ? 'prose-invert' : ''} max-w-none markdown-content`}>
                        <ReactMarkdown>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex justify-center">
                    <div className="bg-red-50 text-red-600 rounded-xl px-4 py-2 text-sm border border-red-200 shadow-sm">
                      <p>{error}</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-px" />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <form onSubmit={handleSubmit} className="flex space-x-3">
                  <div className="flex-1 min-w-0 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask me anything about this ticket..."
                      className="block w-full rounded-2xl border-0 bg-gray-50 py-3 pl-4 pr-12 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                      disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="inline-flex items-center rounded-full bg-blue-600 p-2 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Send message</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition.Root>
  );
} 
