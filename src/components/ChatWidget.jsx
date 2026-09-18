import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';
import { ask, getWelcome } from '../lib/chat-engine';
import { answerPersonal, isPersonalQuestion } from '../lib/chat-personal';
const QUICK_CHIPS = {
  ar: ['معايا كام؟', 'صرفت كام الشهر ده؟', 'عليا كام؟', 'أهدافي', 'إيه المميزات؟'],
  en: ['How much do I have?', 'Spent this month?', 'What do I owe?', 'My goals', 'Features?'],
};
export function ChatWidget() {
  const { lang, state, fmtMoney } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastTopicRef = useRef(null);
  // رسالة ترحيب
  useEffect(() => {
    if (open && messages.length === 0) {
      const w = getWelcome(lang);
      setMessages([{
        role: 'bot',
        text: w[lang],
        suggestions: QUICK_CHIPS[lang],
      }]);
    }
  }, [open, lang, messages.length]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);
  const respond = (text) => {
    // ═══ 1) دائمًا: جرّب المحرك الشخصي الأول
    try {
      const personal = answerPersonal(text, state, lang, fmtMoney);
      if (personal && personal.text) return personal;
    } catch (e) {
      console.warn('personal error', e);
    }
    // ═══ 2) بعدها: المحرك العام
    try {
      const general = ask(text, {
        lang,
        state,
        lastTopicId: lastTopicRef.current,
        history: messages.slice(-3),
      });
      if (general && general.text) {
        if (general.topicId) lastTopicRef.current = general.topicId;
        return general;
      }
    } catch (e) {
      console.warn('general error', e);
    }
    // ═══ 3) Fallback
    return {
      text: lang === 'ar'
        ? 'معلش مش فاهم. جرّب تسأل عن:\n• معايا كام؟\n• صرفت كام؟\n• عليا كام؟\n• أهدافي\n• إزاي أضيف عملية؟'
        : 'Sorry I did not get that. Try:\n• How much do I have?\n• Spent this month?\n• What do I owe?\n• My goals\n• How to add?',
      suggestions: QUICK_CHIPS[lang],
    };
  };
  const send = (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const answer = respond(text);
      setMessages((m) => [...m, {
        role: 'bot',
        text: answer.text,
        suggestions: answer.suggestions || [],
      }]);
      setTyping(false);
    }, 350);
  };
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="press fixed z-40 bottom-24 lg:bottom-6 end-4 w-14 h-14 rounded-full grid place-items-center shadow-xl transition-all hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)',
          boxShadow: '0 12px 30px -6px rgba(14,159,110,.5), 0 4px 12px rgba(0,0,0,.2)',
        }}
        aria-label="Chat"
        data-tour="chat"
      >
        {open ? (
          <Icon name="x" size={22} className="text-white" sw={2.4} />
        ) : (
          <img src="/mascot.png" alt="Chat" className="w-9 h-9 object-contain" draggable="false" />
        )}
      </button>
      {open && (
        <div
          className="fixed z-50 bottom-40 lg:bottom-24 end-4 w-[calc(100vw-2rem)] sm:w-[400px] h-[560px] max-h-[calc(100vh-8rem)] bg-surface border border-line rounded-3xl shadow-2xl flex flex-col overflow-hidden anim-scale"
          style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,.5)', backdropFilter: 'blur(24px)' }}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-line shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent-soft) 0%, transparent 100%)' }}>
            <div className="w-10 h-10 rounded-full grid place-items-center shrink-0 overflow-hidden bg-accentSoft">
              <img src="/mascot.png" alt="Mascot" className="w-9 h-9 object-contain" draggable="false" />
            </div>
            <div className="min-w-0 grow">
              <div className="text-[13.5px] font-bold leading-tight">
                {lang === 'ar' ? 'مساعد الحصالة' : 'El-Hasala Assistant'}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {lang === 'ar' ? 'جاهز يساعدك' : 'Ready to help'}
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="press w-8 h-8 rounded-lg grid place-items-center text-muted hover:text-ink hover:bg-surface2 transition">
              <Icon name="x" size={16} />
            </button>
          </div>
          <div className="grow overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
            {messages.map((m, i) => (
              <div key={i} className={'flex gap-2 ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-accentSoft grid place-items-center shrink-0 overflow-hidden self-end mb-0.5">
                    <img src="/mascot.png" alt="" className="w-6 h-6 object-contain" draggable="false" />
                  </div>
                )}
                <div className="max-w-[82%]">
                  <div className={
                    'px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line ' +
                    (m.role === 'user'
                      ? 'bg-accent text-white dark:text-[#04150E] rounded-br-md'
                      : 'bg-surface2 text-ink rounded-bl-md border border-line')
                  }>
                    {m.text}
                  </div>
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.suggestions.map((s, si) => (
                        <button key={si} onClick={() => send(s)}
                          className="press text-[11.5px] px-2.5 py-1 rounded-full bg-surface2 border border-line text-muted hover:text-accent hover:border-accent/40 transition">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-accentSoft grid place-items-center shrink-0 overflow-hidden self-end mb-0.5">
                  <img src="/mascot.png" alt="" className="w-6 h-6 object-contain" draggable="false" />
                </div>
                <div className="bg-surface2 border border-line px-3.5 py-2.5 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '120ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '240ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-line p-3 shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="field rounded-2xl flex items-center gap-2 px-3 h-11">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang === 'ar' ? 'اكتب سؤالك...' : 'Type your question...'}
                className="grow bg-transparent text-[13.5px] outline-none placeholder:text-muted/60"
              />
              <button type="submit" disabled={!input.trim()}
                className="press w-8 h-8 rounded-lg grid place-items-center bg-accent text-white dark:text-[#04150E] disabled:opacity-30 disabled:pointer-events-none transition">
                <Icon name="arrowUp" size={15} sw={2.4} className={lang === 'ar' ? 'flip' : ''} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}