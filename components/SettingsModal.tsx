import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Cable, CircleCheck, LoaderCircle, X, Moon, Sun, Monitor } from 'lucide-react';
import SegmentedControl from './SegmentedControl';
import { testOllamaConnection } from '../ocrService';
import {
  validateOllamaSettings,
  type OllamaSettings,
  type Theme,
} from '../settings';

interface SettingsModalProps extends OllamaSettings {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: OllamaSettings) => void;
}

type ConnectionTestState =
  | { status: 'idle' }
  | { status: 'testing' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  baseUrl,
  model,
  theme,
}) => {
  const [draftBaseUrl, setDraftBaseUrl] = useState(baseUrl);
  const [draftModel, setDraftModel] = useState(model);
  const [draftTheme, setDraftTheme] = useState<Theme>(theme);
  const [errors, setErrors] = useState<{ baseUrl?: string; model?: string }>({});
  const [connectionTest, setConnectionTest] = useState<ConnectionTestState>({ status: 'idle' });
  const baseUrlInputRef = useRef<HTMLInputElement>(null);
  const connectionControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDraftBaseUrl(baseUrl);
    setDraftModel(model);
    setDraftTheme(theme);
    const validation = validateOllamaSettings({ baseUrl, model, theme });
    setErrors(validation.value ? {} : validation.errors);
    connectionControllerRef.current?.abort();
    connectionControllerRef.current = null;
    setConnectionTest({ status: 'idle' });
  }, [isOpen, baseUrl, model, theme]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => baseUrlInputRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(frame);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => connectionControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (isOpen) return;
    connectionControllerRef.current?.abort();
    connectionControllerRef.current = null;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const validation = validateOllamaSettings({
      baseUrl: draftBaseUrl,
      model: draftModel,
      theme: draftTheme,
    });
    setErrors(validation.errors);
    if (!validation.value) return;

    onSave(validation.value);
    onClose();
  };

  const invalidateConnectionTest = () => {
    connectionControllerRef.current?.abort();
    connectionControllerRef.current = null;
    setConnectionTest({ status: 'idle' });
  };

  const handleTestConnection = async () => {
    const validation = validateOllamaSettings({
      baseUrl: draftBaseUrl,
      model: draftModel,
      theme: draftTheme,
    });
    setErrors(validation.errors);
    if (!validation.value) return;

    connectionControllerRef.current?.abort();
    const controller = new AbortController();
    connectionControllerRef.current = controller;
    setConnectionTest({ status: 'testing' });

    try {
      const result = await testOllamaConnection(
        validation.value.baseUrl,
        validation.value.model,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setConnectionTest({
        status: 'success',
        message: `Connected. Model "${validation.value.model}" is available (${result.availableModels.length} model${result.availableModels.length === 1 ? '' : 's'} reported).`,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      setConnectionTest({
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection test failed.',
      });
    } finally {
      if (connectionControllerRef.current === controller) {
        connectionControllerRef.current = null;
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 id="settings-title" className="text-lg font-bold text-slate-900 dark:text-white">Settings</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings without saving"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Appearance
            </label>
            <SegmentedControl
              name="theme-selector"
              value={draftTheme}
              onChange={setDraftTheme}
              fullWidth={true}
              options={[
                { value: 'system', label: 'System', icon: Monitor },
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
              ]}
            />
          </div>

          <div>
            <label htmlFor="ollama-base-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ollama Base URL
            </label>
            <input
              id="ollama-base-url"
              ref={baseUrlInputRef}
              type="text"
              value={draftBaseUrl}
              onChange={(event) => {
                setDraftBaseUrl(event.target.value);
                invalidateConnectionTest();
                if (errors.baseUrl) setErrors((current) => ({ ...current, baseUrl: undefined }));
              }}
              aria-invalid={Boolean(errors.baseUrl)}
              aria-describedby={errors.baseUrl ? 'ollama-base-url-error' : 'ollama-base-url-help'}
              placeholder={`${window.location.origin}/ollama/v1`}
              className={`w-full px-3 py-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${
                errors.baseUrl
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {errors.baseUrl ? (
              <p id="ollama-base-url-error" className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.baseUrl}</p>
            ) : (
              <p id="ollama-base-url-help" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Use an http(s) URL or the same-origin /ollama proxy.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="ollama-model" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Model Name
            </label>
            <input
              id="ollama-model"
              type="text"
              value={draftModel}
              onChange={(event) => {
                setDraftModel(event.target.value);
                invalidateConnectionTest();
                if (errors.model) setErrors((current) => ({ ...current, model: undefined }));
              }}
              aria-invalid={Boolean(errors.model)}
              aria-describedby={errors.model ? 'ollama-model-error' : 'ollama-model-help'}
              placeholder="qwen3-vl:8b-instruct"
              className={`w-full px-3 py-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${
                errors.model
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {errors.model ? (
              <p id="ollama-model-error" className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.model}</p>
            ) : (
              <p id="ollama-model-help" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                The installed Ollama vision model to use.
              </p>
            )}
          </div>

          {connectionTest.status !== 'idle' && (
            <div
              role="status"
              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                connectionTest.status === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : connectionTest.status === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              {connectionTest.status === 'testing' ? (
                <LoaderCircle size={16} className="mt-0.5 shrink-0 animate-spin" />
              ) : connectionTest.status === 'success' ? (
                <CircleCheck size={16} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
              )}
              <span>
                {connectionTest.status === 'testing' ? 'Testing Ollama connection…' : connectionTest.message}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={connectionTest.status === 'testing'}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {connectionTest.status === 'testing' ? <LoaderCircle size={16} className="animate-spin" /> : <Cable size={16} />}
            Test Connection
          </button>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
