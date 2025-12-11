import React from 'react';
import { AgentConfig } from '../types';

interface AgentCardProps {
  agent: AgentConfig;
  isActive: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, isActive }) => {
  const Icon = agent.icon;
  
  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg border transition-all duration-300
      ${isActive 
        ? 'bg-hospital-50 border-hospital-500 shadow-sm' 
        : 'bg-white border-slate-200 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}
    `}>
      <div className={`p-2 rounded-full text-white ${agent.color}`}>
        <Icon size={20} />
      </div>
      <div>
        <h3 className={`font-semibold text-sm ${isActive ? 'text-hospital-900' : 'text-slate-600'}`}>
          {agent.name}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-1">{agent.description}</p>
      </div>
      {isActive && (
        <div className="ml-auto">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>
      )}
    </div>
  );
};

export default AgentCard;