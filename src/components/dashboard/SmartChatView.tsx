import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatService } from '../../services/chatService';
import { documentService } from '../../services/documentService';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  senderName: string;
  avatar: string;
  citation?: string;
}

export const SmartChatView: React.FC = () => {
  // Read config from localStorage
  const includePublic = localStorage.getItem('smartChatIncludePublic') === 'true';
  const activeModel = localStorage.getItem('smartChatModel') || 'gemini-2.5-flash-lite';
  const savedTemp = localStorage.getItem('smartChatTemperature');
  const activeTemperature = savedTemp ? parseFloat(savedTemp) : 0.2;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Document ID to originalFileName map for citation resolution
  const [documentNamesMap, setDocumentNamesMap] = useState<Record<number, string>>({});

  const userAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuBPOtHdkK3q1RuRa0eWcRdWrXzjGxNBb9CAYqiXL5iBvNhQZQKl7G0RGvQ79sGLRsIPXdXqVkDlXJqkt0UPTXJalUAP6p4RkSEjwYJ8H9iKPvuxItA4WRqbxBCNFbvShzoA909VlVFgtS8fL4dwS6fFkEFZzxHenm3dB1rqCqYPAgBhPHIkmjO0p_oSBgm0_2tiaaN_2CMEkV3a9xGXRPmwKn5fhRh9vsfU5eo4hGgX0RswA9Mpg5hf81M-6Ig3sUttXhMJjEOtPLvr";

  // Auto-scroll chat history
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  // Load welcome message and document names for citation resolution on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([
      {
        id: 'm1',
        sender: 'ai',
        senderName: 'Aether AI',
        avatar: 'auto_awesome',
        text: `Hello! I'm your Smart Chat assistant. I can search across all files in your storage to answer questions.\n\n**Current Configuration:**\n* **Model:** \`${activeModel}\`\n* **Creativity (Temperature):** \`${activeTemperature}\`\n* **Search Scope:** ${
          includePublic 
            ? 'My Files + Public Community Documents (Broad retrieval)' 
            : 'My Files only (Private retrieval)'
        }\n\nWhat would you like to ask today?`,
      },
    ]);

    // Fetch documents to build citation map
    const fetchDocsForCitations = async () => {
      try {
        const map: Record<number, string> = {};
        
        // Load user documents
        const myDocsResponse = await documentService.getMyDocuments();
        if (myDocsResponse.data && myDocsResponse.data.success) {
          myDocsResponse.data.data.forEach((doc) => {
            map[doc.documentId] = doc.originalFileName;
          });
        }

        // Load public documents
        const publicDocsResponse = await documentService.getPublicDocuments();
        if (publicDocsResponse.data && publicDocsResponse.data.success) {
          publicDocsResponse.data.data.forEach((doc) => {
            map[doc.documentId] = doc.originalFileName;
          });
        }

        setDocumentNamesMap(map);
      } catch (err) {
        console.error('Failed to load documents for citation mapping:', err);
      }
    };

    fetchDocsForCitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isAiLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: 'You',
      avatar: userAvatar,
      text: inputVal,
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = inputVal.trim();
    setInputVal('');
    setIsAiLoading(true);

    try {
      // Call Multi RAG chat with UserStorage mode
      const response = await chatService.askMultiQuestion({
        mode: 'UserStorage',
        selectedDocumentIds: null,
        folderId: null,
        question: query,
        useGeneralKnowledge: includePublic,
        model: activeModel,
        temperature: activeTemperature,
      });

      if (response.data && response.data.success) {
        const data = response.data.data;

        let citationStr = '';
        if (data.usedDocumentIds && data.usedDocumentIds.length > 0) {
          const names = data.usedDocumentIds.map((id) => {
            return documentNamesMap[id] || `Doc ID ${id}`;
          });
          citationStr = `Sources: ${names.join(', ')}`;
        }

        const aiResponse: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          senderName: 'Aether AI',
          avatar: 'smart_toy',
          text: data.answer,
          citation: citationStr || undefined,
        };
        setMessages((prev) => [...prev, aiResponse]);
      } else {
        const errorMsg = response.error || 'Failed to retrieve AI answer.';
        const aiResponse: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          senderName: 'Aether AI',
          avatar: 'smart_toy',
          text: `Error: ${errorMsg}`,
        };
        setMessages((prev) => [...prev, aiResponse]);
      }
    } catch (err) {
      console.error('Error in Smart Chat query:', err);
      const aiResponse: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        senderName: 'Aether AI',
        avatar: 'smart_toy',
        text: 'An unexpected error occurred while querying the AI Smart Chat service.',
      };
      setMessages((prev) => [...prev, aiResponse]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCitationClick = (citationText: string) => {
    alert(citationText);
  };

  return (
    <div className="bg-surface rounded-2xl border border-surface-variant flex flex-col h-[calc(100vh-140px)] min-h-[500px] overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.02)] relative">
      {/* Header Info */}
      <div className="h-16 border-b border-surface-variant/40 flex items-center px-6 bg-surface-bright shrink-0 shadow-sm z-20 select-none">
        <div className="flex items-center gap-2.5 text-primary">
          <span className="material-symbols-outlined fill">smart_toy</span>
          <div>
            <h2 className="font-title-md text-title-md font-bold text-on-surface">Smart Chat</h2>
            <p className="text-[11px] text-secondary font-medium flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${includePublic ? 'bg-emerald-500' : 'bg-primary'}`} />
              <span>
                {includePublic 
                  ? 'Scope: My Files + Community (Public)' 
                  : 'Scope: My Files only'}
              </span>
              <span className="text-outline">•</span>
              <span>Model: <code className="bg-surface-container px-1 py-0.5 rounded text-primary font-mono">{activeModel}</code></span>
              <span className="text-outline">•</span>
              <span>Temp: {activeTemperature}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar pb-36 bg-surface-container-lowest/20">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          return (
            <div key={msg.id} className={`flex gap-4 max-w-[85%] ${isAi ? '' : 'self-end flex-row-reverse'}`}>
              {/* Avatar */}
              {isAi ? (
                <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px] select-none">
                    {msg.avatar}
                  </span>
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-outline-variant">
                  <img src={msg.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Message content bubble */}
              <div className={`flex flex-col gap-1.5 ${isAi ? 'items-start' : 'items-end'}`}>
                <span className="font-label-md text-label-md text-secondary ml-1 select-none">
                  {msg.senderName}
                </span>
                
                <div 
                  className={`p-4 shadow-sm text-on-surface font-body-md text-body-md markdown-content leading-relaxed ${
                    isAi
                      ? 'bg-white border rounded-2xl rounded-tl-sm border-outline-variant/60 bg-white/95 text-left'
                      : 'bg-surface-container-high rounded-2xl rounded-tr-sm whitespace-pre-line text-left'
                  }`}
                >
                  {isAi ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                  
                  {/* Citation Badge */}
                  {isAi && msg.citation && (
                    <div 
                      onClick={() => handleCitationClick(msg.citation!)}
                      className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-md border border-outline-variant hover:bg-surface-variant cursor-pointer transition-colors group select-none text-left"
                    >
                      <span className="material-symbols-outlined text-[14px] text-primary group-hover:text-primary-container select-none">
                        description
                      </span>
                      <span className="font-mono-label text-mono-label text-on-surface-variant max-w-[400px] truncate">
                        {msg.citation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Loading state placeholder */}
        {isAiLoading && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 animate-pulse">
              <span className="material-symbols-outlined text-[20px] select-none">auto_awesome</span>
            </div>
            <div className="flex flex-col gap-1 items-start">
              <span className="font-label-md text-label-md text-secondary ml-1 select-none">Aether AI</span>
              <div className="bg-white border rounded-2xl rounded-tl-sm border-outline-variant/40 p-4 shadow-sm flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce delay-75" />
                <span className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce delay-150" />
                <span className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce delay-300" />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area (Sticky Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-surface via-surface to-transparent pt-8 select-none z-10 shrink-0">
        <form onSubmit={handleSendMessage} className="relative flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant focus-within:border-primary-container focus-within:ring-4 focus-within:ring-primary-fixed transition-all shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          <input
            type="text"
            className="flex-1 bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface placeholder:text-secondary-fixed-dim py-3.5 px-4 outline-none"
            placeholder={`Ask a question across all ${includePublic ? 'private and public' : 'private'} documents...`}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isAiLoading}
          />
          <button 
            type="submit"
            className="m-2 w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:bg-on-primary-fixed-variant shadow-[0_2px_4px_rgba(160,65,0,0.2)] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            disabled={isAiLoading || !inputVal.trim()}
          >
            <span className="material-symbols-outlined text-[20px] select-none">arrow_upward</span>
          </button>
        </form>
        <div className="text-center mt-2.5">
          <span className="font-mono-label text-[10px] text-secondary select-none">
            Aether Smart Chat retrieves knowledge from your index. AI can make mistakes.
          </span>
        </div>
      </div>
    </div>
  );
};

export default SmartChatView;
