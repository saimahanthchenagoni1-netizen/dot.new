/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Briefcase, 
  MessageSquare, 
  LayoutGrid, 
  Code, 
  Download, 
  Ghost, 
  ChevronDown, 
  AudioLines,
  Send,
  LogOut,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Mic,
  MicOff,
  Paperclip,
  Image as ImageIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  X,
  FileText,
  Table,
  Share2,
  FolderPlus,
  FileCode,
  Copy,
  Check,
  FileDown,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as XLSX from 'xlsx';
import { getDotResponse } from './services/gemini';

mermaid.initialize({ startOnLoad: false, theme: 'dark' });

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  file?: { name: string; type: string; url: string };
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  mode: AppMode;
}

interface Project {
  id: string;
  name: string;
  description: string;
  sessions: string[]; // session IDs
  timestamp: Date;
}

interface UserInfo {
  name: string;
  age: string;
}

type View = 'chat' | 'history' | 'developer' | 'workspace';
type AppMode = 'chat' | 'developer';

const LANGUAGES = ['All', 'Python', 'JavaScript', 'Java', 'C++', 'CSS', 'HTML', 'TypeScript', 'Rust', 'Go'];

const ArtifactRenderer = ({ content, role }: { content: string, role: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = (text: string) => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 10, 10);
    doc.save('dot-document.pdf');
  };

  const downloadDocx = async (text: string) => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [new Paragraph({ children: [new TextRun(text)] })],
      }],
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dot-document.docx';
    a.click();
  };

  const downloadExcel = (csvData: string) => {
    const rows = csvData.split('\n').map(row => row.split(','));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "dot-spreadsheet.xlsx");
  };

  if (role === 'user') return <div className="text-white">{content}</div>;

  // Split content by code blocks to handle artifacts
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
          const lang = match?.[1] || 'text';
          const code = match?.[2] || '';

          if (lang === 'mermaid') {
            return <MermaidChart key={index} chart={code} />;
          }

          if (lang === 'csv') {
            return (
              <div key={index} className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-bottom border-white/10">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400">Spreadsheet</span>
                  <button onClick={() => downloadExcel(code)} className="p-1 hover:text-white text-gray-400 transition-colors">
                    <FileDown size={14} />
                  </button>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody>
                      {code.split('\n').map((row, i) => (
                        <tr key={i} className="border-b border-white/5">
                          {row.split(',').map((cell, j) => (
                            <td key={j} className="p-2 text-gray-300">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }

          return (
            <div key={index} className="relative group rounded-xl overflow-hidden border border-white/10">
              <div className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a] border-b border-white/5">
                <span className="text-[10px] uppercase tracking-widest text-gray-500">{lang}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleCopy(code)} className="p-1 hover:text-white text-gray-500 transition-colors">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button onClick={() => downloadDocx(code)} className="p-1 hover:text-white text-gray-500 transition-colors">
                    <FileDown size={14} />
                  </button>
                </div>
              </div>
              <SyntaxHighlighter 
                language={lang} 
                style={vscDarkPlus}
                customStyle={{ margin: 0, borderRadius: 0, fontSize: '12px' }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          );
        }

        return (
          <div key={index} className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <div className="mb-8 mt-4">
                    <h1 className="text-4xl font-serif text-white/90 mb-4">{children}</h1>
                    <div className="h-px bg-white/10 w-full" />
                  </div>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-serif font-semibold text-white/80 mt-10 mb-4">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-serif italic text-white/70 mt-6 mb-3">{children}</h3>
                ),
                em: ({ children }) => {
                  const text = String(children);
                  if (text.includes('Marshaled')) {
                    return <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-sans mb-4 opacity-80">{text}</p>;
                  }
                  return <em className="italic">{children}</em>;
                },
                ul: ({ children }) => <ul className="space-y-3 mb-8 list-none">{children}</ul>,
                li: ({ children }) => (
                  <li className="flex gap-3 text-gray-300 leading-relaxed">
                    <span className="text-white/20 mt-1.5">•</span>
                    <span>{children}</span>
                  </li>
                ),
                p: ({ children }) => <p className="leading-relaxed mb-6 text-gray-300 text-base">{children}</p>,
              }}
            >
              {part}
            </ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
};

const MermaidChart = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const chartId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    let isMounted = true;
    if (ref.current && chart.trim()) {
      const renderChart = async () => {
        try {
          setError(null);
          // Clear previous content
          if (ref.current) ref.current.innerHTML = '';
          
          const { svg } = await mermaid.render(chartId.current, chart);
          if (isMounted && ref.current) {
            ref.current.innerHTML = svg;
          }
        } catch (err) {
          console.error('Mermaid render error:', err);
          if (isMounted) setError('Failed to render diagram. Please check syntax.');
        }
      };
      renderChart();
    }
    return () => { isMounted = false; };
  }, [chart]);

  if (error) {
    return (
      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-red-500/30 text-red-400 text-xs font-mono">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10 flex justify-center overflow-x-auto">
      <div ref={ref} className="mermaid" />
    </div>
  );
};

export default function App() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string>(Date.now().toString());
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [view, setView] = useState<View>('chat');
  const [mode, setMode] = useState<AppMode>('chat');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; url: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting('Good Morning');
      else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
      else if (hour >= 17 && hour < 21) setGreeting('Good Evening');
      else setGreeting('Greetings');
    };
    updateGreeting();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, currentSessionId, view, mode]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || {
    id: currentSessionId,
    title: 'New Chat',
    messages: [],
    timestamp: new Date(),
    mode: mode
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim() && ageInput.trim()) {
      setUserInfo({ name: nameInput, age: ageInput });
    }
  };

  const handleVoiceTyping = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please enable it in your browser settings.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedFile({ name: file.name, type: file.type, url });
    }
  };

  const handleRetry = async (messageId: string) => {
    if (isLoading) return;

    // Find the user message before this model message
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;

    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Find the last user message before this index
    let lastUserMessage = '';
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (session.messages[i].role === 'user') {
        lastUserMessage = session.messages[i].text;
        break;
      }
    }

    if (!lastUserMessage) return;

    // Remove all messages from this index onwards
    const updatedMessages = session.messages.slice(0, messageIndex);
    
    setSessions(prev => prev.map(s => s.id === currentSessionId ? {
      ...s,
      messages: updatedMessages
    } : s));

    // Re-trigger send with the last user message
    setIsLoading(true);
    try {
      const history = updatedMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text + (m.file ? ` [Attached File: ${m.file.name}]` : '') }],
      }));

      const responseText = await getDotResponse(history, lastUserMessage, userInfo!.name, userInfo!.age, mode);
      
      const dotMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I'm sorry, I couldn't process that.",
        timestamp: new Date(),
      };

      setSessions(prev => prev.map(s => s.id === currentSessionId ? {
        ...s,
        messages: [...s.messages, dotMessage]
      } : s));
    } catch (error) {
      console.error('Error getting response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const MessageActions = ({ message }: { message: Message }) => {
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

    const handleCopy = () => {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setFeedback('up')}
          className={`p-1.5 rounded-lg transition-colors ${feedback === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
          title="Good response"
        >
          <ThumbsUp size={14} />
        </button>
        <button 
          onClick={() => setFeedback('down')}
          className={`p-1.5 rounded-lg transition-colors ${feedback === 'down' ? 'text-rose-400 bg-rose-400/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
          title="Bad response"
        >
          <ThumbsDown size={14} />
        </button>
        <div className="w-px h-3 bg-white/10 mx-1" />
        <button 
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
        <button 
          onClick={() => handleRetry(message.id)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          title="Regenerate response"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading || !userInfo) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
      file: selectedFile || undefined
    };

    const updatedMessages = [...currentSession.messages, userMessage];
    const newTitle = currentSession.messages.length === 0 ? (input.slice(0, 30) || 'File Upload') : currentSession.title;

    const updatedSession: ChatSession = {
      ...currentSession,
      title: newTitle,
      messages: updatedMessages,
      timestamp: new Date(),
      mode: mode
    };

    setSessions(prev => {
      const exists = prev.find(s => s.id === currentSessionId);
      if (exists) {
        return prev.map(s => s.id === currentSessionId ? updatedSession : s);
      }
      return [updatedSession, ...prev];
    });

    setInput('');
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const history = updatedMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text + (m.file ? ` [Attached File: ${m.file.name}]` : '') }],
      }));

      const contextInput = mode === 'developer' ? `[Language: ${selectedLanguage}] ${input}` : input;
      const responseText = await getDotResponse(history, contextInput || "Analyze the attached file.", userInfo.name, userInfo.age, mode);
      
      const dotMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I'm sorry, I couldn't process that.",
        timestamp: new Date(),
      };

      setSessions(prev => prev.map(s => s.id === currentSessionId ? {
        ...s,
        messages: [...s.messages, dotMessage]
      } : s));
    } catch (error: any) {
      console.error('Error getting response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `**Error:** ${error.message || "Something went wrong. Please check your connection and API key."}`,
        timestamp: new Date(),
      };
      setSessions(prev => prev.map(s => s.id === currentSessionId ? {
        ...s,
        messages: [...s.messages, errorMessage]
      } : s));
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = (targetMode: AppMode = 'chat') => {
    const newId = Date.now().toString();
    setCurrentSessionId(newId);
    setMode(targetMode);
    setView('chat');
  };

  const createProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: `Project ${projects.length + 1}`,
      description: 'New project description',
      sessions: [currentSessionId],
      timestamp: new Date()
    };
    setProjects([newProject, ...projects]);
  };

  const filteredHistory = sessions.filter(s => 
    s.title.toLowerCase().includes(historySearch.toLowerCase()) ||
    s.messages.some(m => m.text.toLowerCase().includes(historySearch.toLowerCase()))
  );

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4 font-sans text-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#242424] rounded-3xl shadow-2xl p-8 border border-white/5 flex flex-col items-center"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 relative overflow-hidden">
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-3 h-3 bg-white rounded-full" 
              />
            </div>
            <h1 className="text-4xl font-serif italic text-white mb-2">Meet Dot</h1>
            <p className="text-gray-400 font-serif italic text-sm">Your minimalist AI companion</p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-6">
            <div>
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em] mb-3">What's your name?</label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-5 py-4 bg-white/5 rounded-2xl border border-white/10 focus:ring-1 focus:ring-white/30 focus:border-transparent outline-none transition-all text-white font-serif italic"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em] mb-3">How old are you?</label>
              <input
                type="number"
                required
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                className="w-full px-5 py-4 bg-white/5 rounded-2xl border border-white/10 focus:ring-1 focus:ring-white/30 focus:border-transparent outline-none transition-all text-white font-serif italic"
                placeholder="Enter your age"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white text-black py-4 rounded-2xl font-serif italic text-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 shadow-lg"
            >
              Login
              <Sparkles size={20} />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const sidebarItems = [
    { icon: Plus, label: 'New Chat', action: () => startNewChat('chat') },
    { icon: MessageSquare, label: 'History', action: () => setView('history') },
    { icon: Briefcase, label: 'Workspace', action: () => setView('workspace') },
    { icon: Code, label: 'Developer', action: () => { setMode('developer'); setView('chat'); } },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex font-sans text-white overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarExpanded ? 240 : 48 }}
        className="flex-shrink-0 border-r border-white/5 flex flex-col py-4 bg-[#1a1a1a] z-20 overflow-hidden"
      >
        <div className="px-3 mb-6 flex items-center justify-between">
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="p-1.5 hover:bg-white/5 rounded-lg cursor-pointer text-gray-400 hover:text-white transition-colors"
          >
            {isSidebarExpanded ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
          {isSidebarExpanded && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-serif italic text-white pr-2"
            >
              Dot
            </motion.span>
          )}
        </div>

        <div className="flex flex-col gap-2 px-2">
          {sidebarItems.map((item, idx) => (
            <div 
              key={idx}
              onClick={item.action}
              className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer text-gray-400 hover:text-white transition-colors group"
            >
              <item.icon size={20} className="flex-shrink-0" />
              {isSidebarExpanded && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium whitespace-nowrap font-serif italic"
                >
                  {item.label}
                </motion.span>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-auto flex flex-col gap-4 px-2">
          <div className="flex items-center gap-3 p-1">
            <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex-shrink-0 flex items-center justify-center text-xs font-medium border border-white/10 cursor-pointer hover:bg-[#3a3a3a] transition-colors">
              {userInfo.name.charAt(0).toUpperCase()}
            </div>
            {isSidebarExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col overflow-hidden"
              >
                <span className="text-sm font-medium truncate font-serif italic">{userInfo.name}</span>
                <button 
                  onClick={() => setUserInfo(null)}
                  className="text-[10px] text-gray-500 hover:text-red-500 transition-colors text-left"
                >
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-end items-center z-10">
          <div className="p-2 text-gray-500 hover:text-white cursor-pointer transition-colors">
            <Ghost size={20} />
          </div>
        </header>

        {view === 'chat' ? (
          <>
            {/* Chat/Greeting Area */}
            <div className="flex-1 relative overflow-hidden">
              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="absolute inset-0 overflow-y-auto flex flex-col items-center px-4 pt-24 pb-12 scroll-smooth"
                style={{
                  maskImage: 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)'
                }}
              >
                {currentSession.messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center mt-20"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center relative overflow-hidden">
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [1, 0.5, 1]
                        }}
                        transition={{ 
                          duration: 4, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-2 h-2 bg-white rounded-full" 
                      />
                    </div>
                    <h1 className="text-5xl font-serif italic text-white/90">
                      {mode === 'developer' ? 'Developer Console' : `${greeting}, ${userInfo.name}`}
                    </h1>
                  </div>
                  {mode === 'developer' && (
                    <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang}
                          onClick={() => setSelectedLanguage(lang)}
                          className={`px-4 py-2 rounded-full text-xs font-serif italic transition-all border ${selectedLanguage === lang ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'}`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="w-full max-w-3xl space-y-10">
                  {currentSession.messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex group ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`${message.role === 'user' ? 'max-w-[85%] bg-[#2a2a2a] px-5 py-4 rounded-2xl border border-white/5' : 'w-full'}`}>
                        {message.file && (
                          <div className="mb-2 p-2 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
                            {message.file.type.startsWith('image/') ? <ImageIcon size={14} /> : <Paperclip size={14} />}
                            <span className="text-[10px] truncate max-w-[150px]">{message.file.name}</span>
                          </div>
                        )}
                        <ArtifactRenderer content={message.text} role={message.role} />
                        {message.role === 'model' && <MessageActions message={message} />}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

            {/* Input Area */}
            <div className="w-full p-6 flex flex-col items-center bg-[#1a1a1a] relative z-10">
              <AnimatePresence>
                {showScrollButton && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={scrollToBottom}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 p-2 bg-[#2a2a2a] border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-[#333] transition-all shadow-lg z-20"
                  >
                    <ChevronDown size={20} />
                  </motion.button>
                )}
              </AnimatePresence>
              <div className="w-full max-w-2xl">
                {selectedFile && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 p-2 bg-[#242424] rounded-xl border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center">
                        {selectedFile.type.startsWith('image/') ? <ImageIcon size={16} /> : <Paperclip size={16} />}
                      </div>
                      <span className="text-xs text-gray-300 truncate max-w-[200px]">{selectedFile.name}</span>
                    </div>
                    <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-white/5 rounded">
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
                <form 
                  onSubmit={handleSend}
                  className="bg-[#242424] rounded-2xl border border-white/5 shadow-2xl overflow-hidden focus-within:border-white/10 transition-colors"
                >
                  <div className="p-4">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e as any);
                        }
                      }}
                      placeholder="How can I help you today?"
                      className="w-full bg-transparent border-none outline-none resize-none text-white placeholder-gray-500 min-h-[60px] font-serif italic"
                      rows={1}
                    />
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between border-t border-white/5 bg-[#2a2a2a]/30">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-gray-500 hover:text-white transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer hover:text-white transition-colors font-serif italic">
                        Dot 1.0 Extended <ChevronDown size={12} />
                      </div>
                      <button 
                        type="button" 
                        onClick={handleVoiceTyping}
                        className={`p-1.5 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-white'}`}
                        title={isListening ? "Stop listening" : "Start voice typing"}
                      >
                        {isListening ? <Mic size={18} /> : <AudioLines size={18} />}
                      </button>
                      {(input.trim() || selectedFile) && (
                        <button 
                          type="submit"
                          className="p-1.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Send size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </form>
                <div className="mt-4 flex flex-col items-center gap-2 px-2">
                  <p className="text-[10px] text-gray-600 font-serif italic text-center opacity-70">
                    Dot can make mistakes. Please verify important information.
                  </p>
                  <div className="w-full flex justify-end">
                    <button 
                      onClick={() => setUserInfo(null)}
                      className="text-[10px] text-gray-600 hover:text-red-500 transition-colors flex items-center gap-1 font-serif italic"
                    >
                      <LogOut size={10} /> Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : view === 'history' ? (
          <div className="flex-1 overflow-y-auto p-8 pt-24 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-serif italic">Chat History</h2>
              <div className="relative w-64">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text"
                  placeholder="Search history..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:ring-white/30 outline-none font-serif italic text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredHistory.length > 0 ? (
                filteredHistory.map(session => (
                  <motion.div
                    key={session.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => {
                      setCurrentSessionId(session.id);
                      setMode(session.mode);
                      setView('chat');
                    }}
                    className="p-4 bg-[#242424] rounded-2xl border border-white/5 hover:border-white/20 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                        {session.mode === 'developer' ? <Code size={20} /> : <HistoryIcon size={20} />}
                      </div>
                      <div>
                        <h3 className="font-serif italic text-lg">{session.title}</h3>
                        <p className="text-xs text-gray-500">{session.timestamp.toLocaleDateString()} • {session.messages.length} messages • {session.mode}</p>
                      </div>
                    </div>
                    <ChevronDown className="-rotate-90 text-gray-600 group-hover:text-white transition-colors" size={20} />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 text-gray-500 font-serif italic">
                  No history found matching your search.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 pt-24 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-serif italic mb-2">Workspace</h2>
                <p className="text-gray-500 font-serif italic">Manage your projects and folders</p>
              </div>
              <button 
                onClick={createProject}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-serif italic hover:bg-gray-200 transition-colors"
              >
                <FolderPlus size={20} /> New Project
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <motion.div
                  key={project.id}
                  whileHover={{ y: -5 }}
                  className="p-6 bg-[#242424] rounded-3xl border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                      <LayoutGrid size={24} />
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500"><Share2 size={16} /></button>
                      <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500"><X size={16} /></button>
                    </div>
                  </div>
                  <h3 className="text-xl font-serif italic mb-2">{project.name}</h3>
                  <p className="text-sm text-gray-500 mb-6 line-clamp-2">{project.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[10px] text-gray-600 uppercase tracking-widest">{project.sessions.length} Chats</span>
                    <button className="text-xs text-white hover:underline font-serif italic">Open Project</button>
                  </div>
                </motion.div>
              ))}
              {projects.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                  <p className="text-gray-500 font-serif italic">Your workspace is empty. Create a project to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
