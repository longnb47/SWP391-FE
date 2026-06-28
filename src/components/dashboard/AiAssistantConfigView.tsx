import React, { useState, useEffect } from 'react';

export const AiAssistantConfigView: React.FC = () => {
  // Config states persisted in localStorage
  const [includePublic, setIncludePublic] = useState<boolean>(() => {
    return localStorage.getItem('smartChatIncludePublic') === 'true';
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('smartChatModel') || 'Gemini 1.5 Flash (Default)';
  });
  const [selectedPersona, setSelectedPersona] = useState<string>(() => {
    return localStorage.getItem('smartChatPersona') || 'Helpful Tutor (Default)';
  });
  const [temperature, setTemperature] = useState<number>(() => {
    const savedTemp = localStorage.getItem('smartChatTemperature');
    return savedTemp ? parseFloat(savedTemp) : 0.7;
  });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Auto-persist to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('smartChatIncludePublic', String(includePublic));
    localStorage.setItem('smartChatModel', selectedModel);
    localStorage.setItem('smartChatPersona', selectedPersona);
    localStorage.setItem('smartChatTemperature', String(temperature));

    // Flash a brief "Settings Saved" indicator
    /* eslint-disable react-hooks/set-state-in-effect */
    setSaveStatus('Settings auto-saved');
    /* eslint-enable react-hooks/set-state-in-effect */
    const timer = setTimeout(() => setSaveStatus(null), 1500);
    return () => clearTimeout(timer);
  }, [includePublic, selectedModel, selectedPersona, temperature]);

  const models = [
    { id: 'flash', name: 'Gemini 1.5 Flash (Default)', desc: 'Fast, lightweight and highly responsive.' },
    { id: 'pro', name: 'Gemini 1.5 Pro', desc: 'Highly complex reasoning and multimodality.' },
    { id: 'claude', name: 'Claude 3.5 Sonnet', desc: 'State-of-the-art code generation and explanation.' }
  ];

  const personas = [
    { id: 'tutor', name: 'Helpful Tutor (Default)', desc: 'Provides detailed explanations and breakdowns.' },
    { id: 'academic', name: 'Strict Academic', desc: 'Answers questions concisely, adhering strictly to document context.' },
    { id: 'summarizer', name: 'Concise Summarizer', desc: 'Provides bulleted summaries and bulletpoints.' }
  ];

  return (
    <div className="bg-surface rounded-2xl border border-surface-variant p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-variant select-none">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
            AI Assistant Config
          </h2>
          <p className="text-secondary text-body-sm mt-1">
            Configure the default search scope, model parameters, and response style for Smart Chat.
          </p>
        </div>
        
        {saveStatus && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-full border border-emerald-200/50 transition-all animate-pulse">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left column: Search scope & Temperature */}
        <div className="space-y-6">
          
          {/* Card 1: Retrieval Scope */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-5 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined text-[24px]">travel_explore</span>
              <h3 className="text-title-md font-bold text-on-surface select-none">Retrieval Scope (Phạm vi truy cập)</h3>
            </div>
            
            <p className="text-body-sm text-secondary select-none">
              Control whether Smart Chat should retrieve knowledge from files uploaded to the Public Community in addition to your own files.
            </p>

            <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-outline-variant/30">
              <div className="space-y-1 select-none pr-4">
                <span className="text-body-md font-bold text-on-surface">Include Public Documents</span>
                <p className="text-label-md text-secondary">
                  Khi bật, AI sẽ truy vấn từ cả tài liệu cá nhân (My Files) và cộng đồng (Community).
                </p>
              </div>

              {/* Tailwind Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePublic}
                  onChange={(e) => setIncludePublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          </div>

          {/* Card 2: Creativity slider */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-5 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 text-tertiary">
              <span className="material-symbols-outlined text-[24px]">tune</span>
              <h3 className="text-title-md font-bold text-on-surface select-none">Creativity (Độ sáng tạo)</h3>
            </div>
            
            <p className="text-body-sm text-secondary select-none">
              Adjust Temperature parameter. Higher temperature results in more creative answers, while lower values make it strictly factual.
            </p>

            <div className="space-y-3 bg-surface p-4 rounded-lg border border-outline-variant/30">
              <div className="flex justify-between items-center select-none">
                <span className="text-label-md font-bold text-on-surface">Temperature</span>
                <span className="font-mono text-body-sm bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30 text-primary font-bold">
                  {temperature.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-secondary select-none">
                <span>Strict Context (0.0)</span>
                <span>Balanced (0.7)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Models & Personas */}
        <div className="space-y-6">
          
          {/* Card 3: Model config */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-5 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined text-[24px]">memory</span>
              <h3 className="text-title-md font-bold text-on-surface select-none">AI Model Selection</h3>
            </div>

            <div className="space-y-3">
              {models.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model.name)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 select-none ${
                    selectedModel === model.name
                      ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                      : 'border-outline-variant/30 bg-surface hover:bg-surface-container-high'
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="radio"
                      name="aiModel"
                      checked={selectedModel === model.name}
                      onChange={() => setSelectedModel(model.name)}
                      className="accent-primary cursor-pointer h-4 w-4"
                    />
                  </div>
                  <div>
                    <span className="text-body-sm font-bold text-on-surface block">{model.name}</span>
                    <span className="text-label-md text-secondary block mt-0.5">{model.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Persona config */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-5 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 text-tertiary">
              <span className="material-symbols-outlined text-[24px]">face</span>
              <h3 className="text-title-md font-bold text-on-surface select-none">Response Style (Persona)</h3>
            </div>

            <div className="space-y-3">
              {personas.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPersona(p.name)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 select-none ${
                    selectedPersona === p.name
                      ? 'border-tertiary/50 bg-tertiary/5 ring-1 ring-tertiary/20'
                      : 'border-outline-variant/30 bg-surface hover:bg-surface-container-high'
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="radio"
                      name="aiPersona"
                      checked={selectedPersona === p.name}
                      onChange={() => setSelectedPersona(p.name)}
                      className="accent-tertiary cursor-pointer h-4 w-4"
                    />
                  </div>
                  <div>
                    <span className="text-body-sm font-bold text-on-surface block">{p.name}</span>
                    <span className="text-label-md text-secondary block mt-0.5">{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AiAssistantConfigView;
