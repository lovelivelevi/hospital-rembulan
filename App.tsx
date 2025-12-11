import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, ShieldCheck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Message, AgentType, ProcessingState } from './types';
import { AGENTS } from './constants';
import { runNavigator, runSpecialistAgent } from './services/geminiService';

import AgentCard from './components/AgentCard';
import MessageBubble from './components/MessageBubble';

function App() {
  // State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Selamat datang di **SIARS** (Sistem Informasi Akuntabilitas Rumah Sakit). Saya Navigator Anda. Ada yang bisa saya bantu terkait jadwal, rekam medis, atau administrasi?",
      sender: "Sistem Navigator",
      agentType: AgentType.NAVIGATOR,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.NAVIGATOR);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, processingState]);

  const handleSend = async () => {
    if (!input.trim() || processingState !== 'idle') return;

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setProcessingState('navigating');
    setActiveAgent(AgentType.NAVIGATOR);

    try {
      // 1. Run Navigator (Internal Control & Delegation)
      const navResponse = await runNavigator(userMsg.text);

      // Add Navigator's confirmation/acknowledgement
      const navMsg: Message = {
        id: uuidv4(),
        role: 'model',
        text: navResponse.navigatorMessage,
        sender: AGENTS[AgentType.NAVIGATOR].name,
        agentType: AgentType.NAVIGATOR,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, navMsg]);

      // 2. Check for Delegation
      if (navResponse.delegatedAgent) {
        setProcessingState('delegating');
        
        // System message indicating transfer
        const transferMsg: Message = {
          id: uuidv4(),
          role: 'system',
          text: `Mengalihkan akses aman ke: ${AGENTS[navResponse.delegatedAgent].name}...`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, transferMsg]);
        
        // Update visual active agent
        setActiveAgent(navResponse.delegatedAgent);
        setProcessingState('responding');

        // 3. Run Specialist Agent
        const agentResponseText = await runSpecialistAgent(
          navResponse.delegatedAgent, 
          navResponse.delegationContext || userMsg.text
        );

        const agentMsg: Message = {
          id: uuidv4(),
          role: 'model',
          text: agentResponseText,
          sender: AGENTS[navResponse.delegatedAgent].name,
          agentType: navResponse.delegatedAgent,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentMsg]);
      } 
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: uuidv4(),
        role: 'system',
        text: "Terjadi kesalahan pada sistem. Silakan coba lagi.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setProcessingState('idle');
      // Reset to navigator visually after interaction (optional, but keeps 'gateway' concept)
      // setActiveAgent(AgentType.NAVIGATOR); 
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Agents Status */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-8 text-hospital-700">
            <ShieldCheck size={28} />
            <h1 className="font-bold text-xl tracking-tight">SIARS <span className="text-slate-400 font-light text-sm block">Internal Control System</span></h1>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Active Agents Status
            </h2>
            {Object.values(AGENTS).map((agent) => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                isActive={activeAgent === agent.id} 
              />
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-400 text-center">
            <p>Mematuhi Permenkes 24/2022</p>
            <p>&copy; 2024 Hospital System</p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col w-full h-full relative">
        
        {/* Header (Mobile Only) */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-2 text-hospital-700">
            <ShieldCheck size={24} />
            <span className="font-bold">SIARS</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2">
          <div className="max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            
            {processingState !== 'idle' && (
              <div className="flex justify-start mb-6">
                 <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-100 px-4 py-2 rounded-full animate-pulse">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <span className="ml-1">
                      {processingState === 'navigating' ? 'Navigator menganalisis...' : 'Agen sedang memproses...'}
                    </span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="max-w-3xl mx-auto w-full">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ketik permintaan Anda (contoh: 'Saya mau cek tagihan' atau 'Jadwal dokter')..."
                disabled={processingState !== 'idle'}
                className="w-full pl-6 pr-14 py-4 rounded-full bg-slate-50 border border-slate-200 focus:border-hospital-500 focus:ring-2 focus:ring-hospital-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 placeholder-slate-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || processingState !== 'idle'}
                className="absolute right-2 p-2 bg-hospital-600 text-white rounded-full hover:bg-hospital-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-2">
              Sistem ini menggunakan AI untuk memisahkan tugas sesuai regulasi. Jangan berikan informasi kartu kredit sensitif di chat.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;