import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { X, Save, Mic, Type } from 'lucide-react';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useAppStore();
  const [summaryStyle, setSummaryStyle] = useState(settings?.summaryStyle || 'default');
  const [customPrompt, setCustomPrompt] = useState(settings?.customPrompts?.[0]?.prompt || '');
  const [openaiKey, setOpenaiKey] = useState(settings?.openaiKey || '');
  const [anthropicKey, setAnthropicKey] = useState(settings?.anthropicKey || '');
  const [summaryModel, setSummaryModel] = useState(settings?.summaryModel || 'gemini-3.1-flash-preview');
  const [liveModel, setLiveModel] = useState(settings?.liveModel || 'gemini-3.1-flash-preview');
  const [micId, setMicId] = useState(settings?.micId || 'default');
  const [fontFamily, setFontFamily] = useState(settings?.fontFamily || 'sans');
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      setMics(devices.filter(d => d.kind === 'audioinput'));
    }).catch(err => console.error('Error enumerating devices:', err));
  }, []);

  const handleSave = async () => {
    if (settings) {
      await updateSettings({
        ...settings,
        summaryStyle,
        customPrompts: customPrompt ? [{ name: 'Custom', prompt: customPrompt }] : [],
        openaiKey,
        anthropicKey,
        summaryModel,
        liveModel,
        micId,
        fontFamily
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Mic size={16} className="text-brat" /> Hardware
            </h3>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Microphone
              </label>
              <select
                value={micId}
                onChange={(e) => setMicId(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brat text-zinc-900 dark:text-zinc-100"
              >
                <option value="default">System Default</option>
                {mics.map(m => (
                  <option key={m.deviceId} value={m.deviceId}>{m.label || `Microphone ${m.deviceId.slice(0, 5)}...`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Type size={16} className="text-brat" /> Appearance
            </h3>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Font Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brat text-zinc-900 dark:text-zinc-100"
              >
                <option value="sans">Roboto (Sans-serif)</option>
                <option value="serif">Roboto Serif</option>
                <option value="slab">Roboto Slab</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-2">Models</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Summary Model
              </label>
              <select
                value={summaryModel}
                onChange={(e) => setSummaryModel(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brat text-zinc-900 dark:text-zinc-100"
              >
                <optgroup label="Google Gemini">
                  <option value="gemini-3.1-flash-preview">Gemini 3.1 Flash (Default)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                </optgroup>
                <optgroup label="OpenAI">
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                </optgroup>
                <optgroup label="Anthropic">
                  <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet</option>
                  <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Live Assistant Model
              </label>
              <select
                value={liveModel}
                onChange={(e) => setLiveModel(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brat text-zinc-900 dark:text-zinc-100"
              >
                <optgroup label="Google Gemini">
                  <option value="gemini-3.1-flash-preview">Gemini 3.1 Flash (Default)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                </optgroup>
                <optgroup label="OpenAI">
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                </optgroup>
                <optgroup label="Anthropic">
                  <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet</option>
                  <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-2">Summary Preferences</h3>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Default Summary Style
              </label>
              <select
                value={summaryStyle}
                onChange={(e) => setSummaryStyle(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brat text-zinc-900 dark:text-zinc-100"
              >
                <option value="default">Default (Granola Style)</option>
                <option value="short">Short & Concise</option>
                <option value="long">Detailed & Comprehensive</option>
                <option value="bullet points only">Bullet Points Only</option>
                <option value="custom">Custom Prompt</option>
              </select>
            </div>

            {summaryStyle === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Custom Prompt
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your custom summary instructions..."
                  className="w-full h-32 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brat text-zinc-900 dark:text-zinc-100 resize-none"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-2">API Keys</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Gemini is provided by default. Add keys below to use OpenAI or Anthropic models. Keys are stored locally in your browser.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brat text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brat text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-brat hover:bg-[#7add00] text-black px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
