'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { DailyLog, Portions } from '@/lib/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAssistantProps {
  currentPortions: Portions;
  today: string;
  token: string;
  onMealLogged: (log: DailyLog) => void;
}

const QUICK_PROMPTS = [
  '¿Qué puedo comer ahora?',
  'Dame una receta con lo que tengo',
  '¿Qué me falta para completar el día?',
  'Receta de postre saludable',
];

export default function ChatAssistant({ currentPortions, today, token, onMealLogged }: ChatAssistantProps) {
  const [displayMessages, setDisplayMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Keep API message history (may include hidden messages) separate from display
  const apiMessages = useRef<ApiMessage[]>([]);
  const currentPortionsRef = useRef(currentPortions);
  const autoTriggered = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    currentPortionsRef.current = currentPortions;
  }, [currentPortions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, loading]);

  const sendMessage = useCallback(
    async (text: string, hidden = false) => {
      if (!text.trim() || loading) return;

      const userMsg: ApiMessage = { role: 'user', content: text.trim() };
      apiMessages.current = [...apiMessages.current, userMsg];

      if (!hidden) {
        setDisplayMessages((prev) => [...prev, { role: 'user', content: text.trim() }]);
      }

      setLoading(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: apiMessages.current,
            currentPortions: currentPortionsRef.current,
            date: today,
          }),
        });

        const data = (await res.json()) as { message: string; loggedFood: DailyLog | null };

        if (data.loggedFood) onMealLogged(data.loggedFood);

        const assistantMsg: ApiMessage = { role: 'assistant', content: data.message || 'No pude responder.' };
        apiMessages.current = [...apiMessages.current, assistantMsg];
        setDisplayMessages((prev) => [...prev, { role: 'assistant', content: assistantMsg.content }]);
      } catch {
        const errMsg = 'Error al conectar. Intenta de nuevo.';
        apiMessages.current = [...apiMessages.current, { role: 'assistant', content: errMsg }];
        setDisplayMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
      } finally {
        setLoading(false);
      }
    },
    [today, token, onMealLogged, loading]
  );

  // Auto-trigger end-of-day summary
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 20 && !autoTriggered.current) {
      autoTriggered.current = true;
      setTimeout(() => sendMessage('Hola, muéstrame el resumen de mi día', true), 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSend() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    sendMessage(text);
  }

  function handleQuickPrompt(prompt: string) {
    setInput(prompt);
    inputRef.current?.focus();
  }

  const isEmpty = displayMessages.length === 0 && !loading;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 py-2">
        {/* Empty state with quick prompts */}
        {isEmpty && (
          <div className="flex flex-col items-center pt-6 gap-5">
            <div className="text-center px-4">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-sm font-semibold text-gray-700">Tu asistente de nutrición</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Pregúntame qué comer, pídeme recetas, o cuéntame qué comiste y lo registro automáticamente
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center px-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="text-xs bg-green-50 border border-green-200 text-green-700 rounded-full px-3 py-2 active:scale-95 transition-all hover:bg-green-100"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {displayMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] text-sm px-3 py-2.5 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-green-500 text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Pregunta o cuéntame qué comiste…"
          disabled={loading}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-300 bg-white disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="bg-green-500 text-white rounded-xl w-11 flex items-center justify-center text-lg font-bold disabled:opacity-40 active:scale-95 transition-all"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
