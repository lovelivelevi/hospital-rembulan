import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, AgentType } from '../types';
import { AGENTS } from '../constants';
import { User, Activity } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          {message.text}
        </span>
      </div>
    );
  }

  const agentConfig = message.agentType ? AGENTS[message.agentType] : AGENTS[AgentType.NAVIGATOR];
  const Icon = isUser ? User : (agentConfig?.icon || Activity);
  const bgColor = isUser ? 'bg-slate-800' : 'bg-white';
  const textColor = isUser ? 'text-white' : 'text-slate-800';
  const borderColor = isUser ? 'border-transparent' : 'border-slate-200';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser ? 'bg-slate-700 text-slate-300' : `${agentConfig?.color} text-white`}
        `}>
          <Icon size={16} />
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {!isUser && (
            <span className="text-xs font-semibold text-slate-500 mb-1 ml-1">
              {message.sender || agentConfig?.name}
            </span>
          )}
          
          <div className={`
            p-4 rounded-2xl shadow-sm border text-sm leading-relaxed
            ${bgColor} ${textColor} ${borderColor}
            ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}
          `}>
             <ReactMarkdown 
               components={{
                 ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                 ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                 strong: ({node, ...props}) => <strong className="font-bold text-hospital-700" {...props} />,
                 p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
               }}
             >
               {message.text}
             </ReactMarkdown>
          </div>
          
          <span className="text-[10px] text-slate-400 mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;