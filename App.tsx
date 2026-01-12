
import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { LinkData, ShortenOptions, GeminiAnalysis, User } from './types';
import { analyzeUrl } from './services/geminiService';
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
  
  // Redirection State
  const [redirectingTo, setRedirectingTo] = useState<LinkData | null>(null);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // Advanced Options State
  const [showOptions, setShowOptions] = useState(false);
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [expiry, setExpiry] = useState('');
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [blockBots, setBlockBots] = useState(false);

  // Load from localStorage
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

    // REDIRECTION LOGIC
    const params = new URLSearchParams(window.location.search);
    const shortCode = params.get('l');
    if (shortCode) {
      const target = currentLinks.find(l => l.shortCode === shortCode);
      if (target) {
        setRedirectingTo(target);
        const updatedLinks = currentLinks.map(l => 
          l.shortCode === shortCode ? { ...l, clicks: l.clicks + 1 } : l
        );
        localStorage.setItem('linky_history', JSON.stringify(updatedLinks));
        setTimeout(() => {
          window.location.assign(target.originalUrl);
        }, 2000);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('linky_history', JSON.stringify(links));
  }, [links]);

  useEffect(() => {
    if (user) localStorage.setItem('linky_user', JSON.stringify(user));
    else localStorage.removeItem('linky_user');
  }, [user]);

  const generateShortCode = () => Math.random().toString(36).substring(2, 8);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // VALIDATION: Shake if there's no dot (missing DNS extension)
    if (!url.includes('.')) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500); // Duration of the animation
      return;
    }

    setLoading(true);
    let analysis: GeminiAnalysis | null = null;
    
    if (isAiEnabled) {
      analysis = await analyzeUrl(url);
    }

    const shortCode = alias || (analysis?.suggestedAliases?.[0] || generateShortCode());
    
    const newLink: LinkData = {
      id: crypto.randomUUID(),
      originalUrl: url.startsWith('http') ? url : `https://${url}`,
      shortCode,
      alias: alias || (isAiEnabled ? analysis?.suggestedAliases[0] : undefined),
      createdAt: Date.now(),
      clicks: 0,
      password: password || undefined,
      expiryDate: expiry || undefined,
      category: analysis?.category || 'General',
      safetyScore: analysis?.safetyRating || 100,
      blockBots: blockBots,
    };

    setLinks(prev => [newLink, ...prev]);
    setUrl('');
    setAlias('');
    setPassword('');
    setExpiry('');
    setBlockBots(false);
    setLoading(false);
    setActiveTab('history');
  };

  const handleCopy = (code: string, id: string) => {
    const functionalUrl = `${window.location.origin}${window.location.pathname}?l=${code}`;
    navigator.clipboard.writeText(functionalUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteLink = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: crypto.randomUUID(),
      name: authForm.name || authForm.email.split('@')[0],
      email: authForm.email,
      plan: 'pro',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authForm.email}`
    };
    setUser(newUser);
    setShowAuthModal(false);
    setAuthForm({ name: '', email: '', password: '' });
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('create');
  };

  // REDIRECTION VIEW
  if (redirectingTo) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center max-w-md w-full">
          <LinkyLogo className="h-16 mb-8 scale-150" />
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-100 border border-indigo-50 w-full space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-20 h-20 text-indigo-600 animate-spin opacity-20" />
              </div>
              <ShieldCheck className="w-20 h-20 text-emerald-500 mx-auto relative z-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Link Securely Verified</h2>
              <p className="text-slate-500 font-medium">Redirecting you to your destination...</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm font-bold text-slate-400 truncate">
              {redirectingTo.originalUrl}
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 animate-[progress_2s_ease-in-out_forwards]"></div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest pt-2">
              <Sparkles className="w-3 h-3" /> Powered by Linky AI
            </div>
          </div>
        </div>
        <style>{`
          @keyframes progress { from { width: 0%; } to { width: 100%; } }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-indigo-100 ${isShaking ? 'animate-discord-shake' : ''}`}>
      {/* CSS Animations */}
      <style>{`
        @keyframes springDown {
          0% { transform: translateY(-40px) scaleY(0.8); opacity: 0; }
          60% { transform: translateY(10px) scaleY(1.05); opacity: 1; }
          80% { transform: translateY(-5px) scaleY(0.98); }
          100% { transform: translateY(0) scaleY(1); opacity: 1; }
        }
        @keyframes itemPop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes discordShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        .animate-spring-down {
          animation: springDown 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-item-pop {
          animation: itemPop 0.4s ease-out forwards;
        }
        .animate-discord-shake {
          animation: discordShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4 scale-125"><LinkyLogo hideText /></div>
              <h2 className="text-2xl font-black text-slate-900">{authMode === 'login' ? 'Welcome back' : 'Create an account'}</h2>
              <p className="text-slate-500 mt-2">{authMode === 'login' ? 'Login to manage your premium links' : 'Get access to advanced analytics and more'}</p>
            </div>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                  <input type="text" required value={authForm.name} onChange={(e) => setAuthForm({...authForm, name: e.target.value})} placeholder="John Doe" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 ring-indigo-50 outline-none transition-all" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <input type="email" required value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} placeholder="name@company.com" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 ring-indigo-50 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                <input type="password" required value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} placeholder="••••••••" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 ring-indigo-50 outline-none transition-all" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 mt-2">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            <p className="text-center text-slate-500 text-sm mt-8">{authMode === 'login' ? "Don't have an account?" : "Already have an account?"} <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="ml-1 text-indigo-600 font-bold hover:underline">{authMode === 'login' ? 'Sign up' : 'Log in'}</button></p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => setActiveTab('create')}>
            <LinkyLogo className="h-9" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setActiveTab('create')} className={`flex items-center gap-2 font-bold transition-all ${activeTab === 'create' ? 'text-indigo-600 scale-105' : 'text-slate-500 hover:text-slate-900'}`}>Shorten</button>
            <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 font-bold transition-all ${activeTab === 'history' ? 'text-indigo-600 scale-105' : 'text-slate-500 hover:text-slate-900'}`}>My Links</button>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-tighter leading-none">{user.plan} plan</p>
                  <p className="text-sm font-bold text-slate-900">{user.name}</p>
                </div>
                <div className="relative group">
                  <img src={user.avatar} className="w-10 h-10 rounded-xl ring-2 ring-indigo-50 cursor-pointer" alt="avatar" />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"><LogOut className="w-4 h-4" /> Sign Out</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="text-slate-600 hover:text-slate-900 font-bold px-4 py-2">Log In</button>
                <button onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Sign Up</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 md:py-20">
        {activeTab === 'create' ? (
          <div className="flex flex-col items-center justify-center space-y-16">
            <div className="text-center space-y-6 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-2 animate-bounce">
                <Sparkles className="w-3 h-3" /> Now with AI Analytics
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">Better links for <span className="text-indigo-600">better brands.</span></h1>
              <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">Join thousands of creators using <span className="text-indigo-600 font-black">LINKY</span> to shorten, analyze and brand their digital presence.</p>
            </div>

            <div className="w-full max-w-3xl space-y-8">
              {/* Shorten Bar */}
              <div className={`bg-white p-3 rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-indigo-50 flex flex-col md:flex-row items-center group focus-within:ring-8 ring-indigo-50 transition-all ${isShaking ? 'border-red-500 ring-red-50 shadow-red-100' : ''}`}>
                <div className="flex-1 flex items-center w-full">
                  <div className="pl-6 text-indigo-400"><Link2 className={`w-7 h-7 ${isShaking ? 'text-red-500' : ''}`} /></div>
                  <input 
                    type="text" 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value)} 
                    placeholder="Enter your long URL..." 
                    className="flex-1 px-4 py-6 text-xl outline-none bg-transparent text-slate-800 placeholder:text-slate-400 font-bold" 
                  />
                </div>
                <button 
                  onClick={handleShorten} 
                  disabled={loading || !url} 
                  className={`w-full md:w-auto px-10 py-5 rounded-[1.75rem] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${isShaking ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 disabled:bg-indigo-300'} text-white`}
                >
                  {loading ? <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" /> : <>Shorten <ArrowRight className="w-6 h-6" /></>}
                </button>
              </div>

              {/* Advanced Controls Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-4 px-4">
                <button 
                  onClick={() => setShowOptions(!showOptions)}
                  className={`flex items-center gap-2 text-sm font-black transition-all uppercase tracking-widest ${showOptions ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Settings className={`w-4 h-4 transition-transform duration-300 ${showOptions ? 'rotate-90' : 'rotate-0'}`} /> 
                  {showOptions ? "Hide Options" : "Advanced Options"}
                </button>

                <div className="flex items-center gap-3 bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">AI Insight</span>
                  <div 
                    onClick={() => setIsAiEnabled(!isAiEnabled)}
                    className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-all ${isAiEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${isAiEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>

              {/* Advanced Options Content with NEW ANIMATION */}
              {showOptions && (
                <div className="mt-6 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(79,70,229,0.1)] animate-spring-down origin-top">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Alias */}
                    <div className="space-y-3 animate-item-pop" style={{ animationDelay: '100ms' }}>
                      <label className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                        <Zap className="w-4 h-4 text-amber-500" /> Alias
                      </label>
                      <input 
                        type="text"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="custom-name"
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl focus:ring-8 ring-indigo-50 outline-none transition-all font-bold text-slate-800"
                      />
                    </div>
                    {/* Privacy */}
                    <div className="space-y-3 animate-item-pop" style={{ animationDelay: '200ms' }}>
                      <label className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                        <Lock className="w-4 h-4 text-indigo-500" /> Privacy
                      </label>
                      <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl focus:ring-8 ring-indigo-50 outline-none transition-all font-bold text-slate-800"
                      />
                    </div>
                    {/* Expiry */}
                    <div className="space-y-3 animate-item-pop" style={{ animationDelay: '300ms' }}>
                      <label className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                        <Calendar className="w-4 h-4 text-rose-500" /> Expiry
                      </label>
                      <input 
                        type="date"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl focus:ring-8 ring-indigo-50 outline-none transition-all font-bold text-slate-800"
                      />
                    </div>
                    {/* Bot Protection */}
                    <div className="space-y-3 animate-item-pop" style={{ animationDelay: '400ms' }}>
                      <label className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                        <Bot className="w-4 h-4 text-emerald-500" /> Bot Protection
                      </label>
                      <div 
                        onClick={() => setBlockBots(!blockBots)}
                        className={`flex items-center gap-3 w-full px-6 py-4 border-2 rounded-2xl cursor-pointer transition-all ${blockBots ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                      >
                        <div className={`w-10 h-6 rounded-full p-1 transition-all ${blockBots ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all ${blockBots ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <span className={`text-sm font-bold ${blockBots ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {blockBots ? 'Blocking Bots active' : 'Block known bots'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trusted Section */}
            <div className="pt-8 text-center">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Trusted by teams at</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 grayscale opacity-40">
                {['Google', 'Netflix', 'Amazon', 'Spotify', 'Twitter'].map(brand => <span key={brand} className="text-2xl font-black text-slate-900 tracking-tighter">{brand}</span>)}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-slate-900">Dashboard</h2>
                <p className="text-slate-500 font-medium">Manage and track your active campaigns</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="hidden md:flex items-center gap-2 text-sm font-black text-slate-400 bg-white border border-slate-100 px-5 py-2.5 rounded-2xl">
                   <History className="w-4 h-4" /> {links.length} LINKS
                 </div>
                 <button onClick={() => setActiveTab('create')} className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                   <Plus className="w-6 h-6" />
                 </button>
              </div>
            </div>

            {links.length === 0 ? (
              <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-24 text-center space-y-6">
                <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-slate-100 scale-125"><LinkyLogo hideText /></div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">Your link forest is empty</h3>
                  <p className="text-slate-500 max-w-sm mx-auto font-medium">Start shortening links to populate your dashboard.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {links.map((link) => (
                  <div key={link.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col gap-8 group hover:border-indigo-300 hover:ring-8 ring-indigo-50/50 transition-all shadow-sm hover:shadow-2xl">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 overflow-hidden">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-black text-slate-900 truncate">linky.it/<span className="text-indigo-600">{link.shortCode}</span></h3>
                          <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">{link.category}</span>
                          {link.blockBots && <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg flex items-center gap-1"><Bot className="w-3 h-3" /> Protected</span>}
                        </div>
                        <p className="text-sm text-slate-400 font-bold truncate max-w-sm"><ExternalLink className="w-3 h-3 inline mr-1" /> {link.originalUrl}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleCopy(link.shortCode, link.id)} className={`p-3 rounded-2xl transition-all border ${copiedId === link.id ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm'}`}>
                          {copiedId === link.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                        <button onClick={() => deleteLink(link.id)} className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Clicks</span><span className="text-2xl font-black text-slate-900">{link.clicks}</span></div>
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Safety</span><span className="text-2xl font-black text-emerald-500">{link.safetyScore}%</span></div>
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-center">
                        <QRCode value={`${window.location.origin}${window.location.pathname}?l=${link.shortCode}`} size={48} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <LinkyLogo className="h-7" />
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">© 2024 LINKY TECHNOLOGIES. MADE WITH AI.</p>
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GDPR COMPLIANT</span></div>
        </div>
      </footer>
    </div>
  );
};

export default App;
