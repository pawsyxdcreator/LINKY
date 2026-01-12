
import React, { useState, useEffect, useRef } from 'react';
import { 
  Link2,
  History, 
  Settings, 
  ShieldCheck, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink, 
  BarChart3, 
  QrCode,
  Zap,
  Lock,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  User as UserIcon,
  LogOut,
  Mail,
  Github,
  Chrome,
  X,
  Loader2,
  Bot,
  ChevronDown,
  MessageCircle,
  Send,
  User as UserChatIcon
} from 'lucide-react';
import { LinkData, ShortenOptions, GeminiAnalysis, User } from './types';
import { analyzeUrl, createLinkyChat } from './services/geminiService';
import QRCode from 'react-qr-code';

// Logo Component
const LinkyLogo: React.FC<{ className?: string; hideText?: boolean }> = ({ className = "h-8", hideText = false }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
      <Link2 className="text-white w-6 h-6" />
    </div>
    {!hideText && (
      <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tighter">
        LINKY
      </span>
    )}
  </div>
);

const App: React.FC = () => {
  const [links, setLinks] = useState<LinkData[]>([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [isShaking, setIsShaking] = useState(false);
  
  // AI Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: '¡Hola! Soy **Linky AI**. ¿En qué puedo ayudarte con tus enlaces hoy? ✨' }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInstance = useRef<any>(null);

  // Redirection State
  const [redirectingTo, setRedirectingTo] = useState<LinkData | null>(null);

  // Auth & Options State
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [showOptions, setShowOptions] = useState(false);
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [expiry, setExpiry] = useState('');
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [blockBots, setBlockBots] = useState(false);

  useEffect(() => {
    const savedLinks = localStorage.getItem('linky_history');
    let currentLinks: LinkData[] = [];
    if (savedLinks) {
      try { 
        currentLinks = JSON.parse(savedLinks);
        setLinks(currentLinks); 
      } catch (e) { console.error(e); }
    }
    const savedUser = localStorage.getItem('linky_user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('linky_history', JSON.stringify(links));
  }, [links]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    if (!url.includes('.')) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setLoading(true);
    let analysis: GeminiAnalysis | null = null;
    if (isAiEnabled) analysis = await analyzeUrl(url);

    const shortCode = alias || (analysis?.suggestedAliases?.[0] || Math.random().toString(36).substring(2, 8));
    
    const newLink: LinkData = {
      id: crypto.randomUUID(),
      originalUrl: url.startsWith('http') ? url : `https://${url}`,
      shortCode,
      createdAt: Date.now(),
      clicks: 0,
      password: password || undefined,
      expiryDate: expiry || undefined,
      category: analysis?.category || 'General',
      safetyScore: analysis?.safetyRating || 100,
      blockBots: blockBots,
    };

    setLinks(prev => [newLink, ...prev]);
    setUrl(''); setAlias(''); setPassword(''); setExpiry(''); setBlockBots(false);
    setLoading(false);
    setActiveTab('history');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiTyping) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiTyping(true);

    try {
      if (!chatInstance.current) {
        chatInstance.current = createLinkyChat(links);
      }
      
      const stream = await chatInstance.current.sendMessageStream({ message: userMsg });
      let fullResponse = '';
      
      setChatMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setChatMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = fullResponse;
          return newMsgs;
        });
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'model', text: 'Lo siento, hubo un error conectando con mis neuronas digitales. 🧠⚠️' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleCopy = (code: string, id: string) => {
    const functionalUrl = `${window.location.origin}${window.location.pathname}?l=${code}`;
    navigator.clipboard.writeText(functionalUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`min-h-screen flex flex-col selection:bg-indigo-100 ${isShaking ? 'animate-discord-shake' : ''}`}>
      <style>{`
        @keyframes springDown {
          0% { transform: translateY(-40px) scaleY(0.8); opacity: 0; }
          60% { transform: translateY(10px) scaleY(1.05); opacity: 1; }
          100% { transform: translateY(0) scaleY(1); opacity: 1; }
        }
        @keyframes discordShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        .animate-spring-down { animation: springDown 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-discord-shake { animation: discordShake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <LinkyLogo className="h-9 cursor-pointer" />
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setActiveTab('create')} className={`font-bold transition-all ${activeTab === 'create' ? 'text-indigo-600' : 'text-slate-500'}`}>Shorten</button>
            <button onClick={() => setActiveTab('history')} className={`font-bold transition-all ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-500'}`}>My Links</button>
          </div>
          <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold">Sign Up</button>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 md:py-20">
        {activeTab === 'create' ? (
          <div className="flex flex-col items-center space-y-16">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-xs font-black uppercase">
                <Sparkles className="w-3 h-3" /> AI-Powered Link Management
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight">Better links for <span className="text-indigo-600">better brands.</span></h1>
            </div>

            <div className="w-full max-w-3xl space-y-8">
              <form onSubmit={handleShorten} className={`bg-white p-3 rounded-[2.5rem] shadow-2xl border border-indigo-50 flex flex-col md:flex-row items-center transition-all ${isShaking ? 'border-red-500 ring-8 ring-red-50' : ''}`}>
                <div className="flex-1 flex items-center w-full">
                  <div className="pl-6 text-indigo-400"><Link2 className="w-7 h-7" /></div>
                  <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter your long URL..." className="flex-1 px-4 py-6 text-xl outline-none font-bold" />
                </div>
                <button type="submit" disabled={loading || !url} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[1.75rem] font-black text-lg flex items-center justify-center gap-3 transition-all">
                  {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <>Shorten <ArrowRight className="w-6 h-6" /></>}
                </button>
              </form>

              <div className="flex items-center justify-between px-4">
                <button onClick={() => setShowOptions(!showOptions)} className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest"><Settings className={`w-4 h-4 transition-all ${showOptions ? 'rotate-90 text-indigo-600' : ''}`} /> Options</button>
                <div className="flex items-center gap-3 bg-white border px-4 py-2 rounded-2xl">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> <span className="text-xs font-black uppercase">AI Insight</span>
                  <div onClick={() => setIsAiEnabled(!isAiEnabled)} className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-all ${isAiEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}><div className={`w-4 h-4 bg-white rounded-full transition-all ${isAiEnabled ? 'translate-x-4' : ''}`} /></div>
                </div>
              </div>

              {showOptions && (
                <div className="mt-6 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl animate-spring-down origin-top grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Alias</label>
                    <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="custom-name" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-4 ring-indigo-50" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase flex items-center gap-2"><Lock className="w-4 h-4 text-indigo-500" /> Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-4 ring-indigo-50" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase flex items-center gap-2"><Calendar className="w-4 h-4 text-rose-500" /> Expiry</label>
                    <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase flex items-center gap-2"><Bot className="w-4 h-4 text-emerald-500" /> Bot Protection</label>
                    <div onClick={() => setBlockBots(!blockBots)} className={`flex items-center gap-3 w-full px-6 py-4 border-2 rounded-2xl cursor-pointer transition-all ${blockBots ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-transparent'}`}>
                      <div className={`w-10 h-6 rounded-full p-1 ${blockBots ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full transition-all ${blockBots ? 'translate-x-4' : ''}`} /></div>
                      <span className="text-sm font-bold text-slate-600">Block known bots</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Dashboard/History View */
          <div className="space-y-10">
            <h2 className="text-4xl font-black text-slate-900">My Dashboard</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {links.map(link => (
                <div key={link.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col gap-8 group hover:border-indigo-300 transition-all shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 truncate">linky.it/<span className="text-indigo-600">{link.shortCode}</span></h3>
                      <p className="text-sm text-slate-400 font-bold truncate max-w-sm"><ExternalLink className="w-3 h-3 inline mr-1" /> {link.originalUrl}</p>
                    </div>
                    <button onClick={() => handleCopy(link.shortCode, link.id)} className={`p-3 rounded-2xl transition-all border ${copiedId === link.id ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                      {copiedId === link.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-3xl"><span className="text-[10px] font-black uppercase block mb-1">Clicks</span><span className="text-2xl font-black">{link.clicks}</span></div>
                    <div className="bg-slate-50 p-4 rounded-3xl"><span className="text-[10px] font-black uppercase block mb-1">Safety</span><span className="text-2xl font-black text-emerald-500">{link.safetyScore}%</span></div>
                    <div className="bg-slate-50 p-4 rounded-3xl flex justify-center"><QRCode value={`linky.it/${link.shortCode}`} size={48} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* AI CHAT WIDGET */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
        {showChat && (
          <div className="w-[350px] md:w-[400px] h-[550px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            {/* Chat Header */}
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl"><Sparkles className="w-5 h-5" /></div>
                <div>
                  <h4 className="font-black leading-none">Linky AI</h4>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Estratega Digital</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="hover:bg-white/10 p-2 rounded-full transition-all"><X className="w-5 h-5" /></button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 chat-scroll bg-slate-50/50">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                  <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-none'}`}>
                    {msg.text || <Loader2 className="animate-spin w-4 h-4 opacity-50" />}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pregúntame algo..."
                className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 ring-indigo-100 transition-all"
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim() || isAiTyping}
                className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Floating Toggle Button */}
        <button 
          onClick={() => setShowChat(!showChat)}
          className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-2xl ${showChat ? 'bg-slate-900 rotate-90' : 'bg-indigo-600 hover:scale-110 active:scale-95 shadow-indigo-300'}`}
        >
          {showChat ? <X className="text-white w-7 h-7" /> : <Sparkles className="text-white w-7 h-7" />}
          {!showChat && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[10px] font-black text-white">1</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default App;
