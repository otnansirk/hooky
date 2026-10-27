'use client';

import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, X } from 'lucide-react';
import { ResponseSettings } from '@/types';

interface ResponseSettingsModalProps {
  endpointId: string;
  onClose: () => void;
}

interface HeaderRow {
  key: string;
  value: string;
}

const CONTENT_TYPES = ['application/json', 'text/plain', 'text/html', 'application/xml'];

const inputClass =
  'w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500';

export function ResponseSettingsModal({ endpointId, onClose }: ResponseSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useCustomBody, setUseCustomBody] = useState(false);
  const [status, setStatus] = useState('200');
  const [contentType, setContentType] = useState('application/json');
  const [body, setBody] = useState('');
  const [headerRows, setHeaderRows] = useState<HeaderRow[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/endpoints/${endpointId}/settings`);
        if (!res.ok) throw new Error();
        const { settings } = (await res.json()) as { settings: ResponseSettings };
        setStatus(String(settings.status));
        setContentType(settings.contentType);
        setUseCustomBody(settings.body !== null);
        setBody(settings.body ?? '');
        setHeaderRows(Object.entries(settings.headers).map(([key, value]) => ({ key, value })));
      } catch {
        setErrorMessage('Unable to load response settings.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [endpointId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const updateHeaderRow = (index: number, field: keyof HeaderRow, value: string) => {
    setHeaderRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleReset = () => {
    setStatus('200');
    setContentType('application/json');
    setUseCustomBody(false);
    setBody('');
    setHeaderRows([]);
  };

  const handleSave = async () => {
    setErrorMessage(null);

    if (useCustomBody && contentType.includes('json') && body.trim()) {
      try {
        JSON.parse(body.replaceAll('{{requestId}}', 'x'));
      } catch {
        setErrorMessage('Body is not valid JSON.');
        return;
      }
    }

    const headers: Record<string, string> = {};
    for (const row of headerRows) {
      if (row.key.trim()) headers[row.key.trim()] = row.value;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/endpoints/${endpointId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: Number(status),
          contentType,
          headers,
          body: useCustomBody ? body : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to save response settings.');
        return;
      }
      onClose();
    } catch {
      setErrorMessage('Network error while saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="response-settings-title"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h2 id="response-settings-title" className="text-sm font-semibold text-zinc-100">
            Custom Response
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-10 text-zinc-400">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
          </div>
        ) : (
          <div className="space-y-4 px-5 py-4 text-xs text-zinc-300">
            <div className="grid grid-cols-3 gap-3">
              <label className="space-y-1.5">
                <span className="block text-zinc-400">Status code</span>
                <input
                  type="number"
                  min={200}
                  max={599}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="col-span-2 space-y-1.5">
                <span className="block text-zinc-400">Content-Type</span>
                <input
                  type="text"
                  list="hooky-content-types"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  disabled={!useCustomBody}
                  className={`${inputClass} disabled:opacity-50`}
                />
                <datalist id="hooky-content-types">
                  {CONTENT_TYPES.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useCustomBody}
                  onChange={(e) => setUseCustomBody(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>Use custom body</span>
              </label>
              {useCustomBody ? (
                <>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    spellCheck={false}
                    placeholder='{"ok": true, "id": "{{requestId}}"}'
                    className={`${inputClass} resize-y`}
                  />
                  <p className="text-zinc-500">
                    Use <code className="text-zinc-300">{'{{requestId}}'}</code> to insert the
                    captured request ID.
                  </p>
                </>
              ) : (
                <p className="text-zinc-500">
                  Default Hooky JSON reply with <code className="text-zinc-300">success</code>,{' '}
                  <code className="text-zinc-300">message</code> and{' '}
                  <code className="text-zinc-300">requestId</code>.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Response headers</span>
                <button
                  onClick={() => setHeaderRows((rows) => [...rows, { key: '', value: '' }])}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add header</span>
                </button>
              </div>
              {headerRows.length === 0 && <p className="text-zinc-500">No custom headers.</p>}
              {headerRows.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="X-Header-Name"
                    value={row.key}
                    onChange={(e) => updateHeaderRow(index, 'key', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="value"
                    value={row.value}
                    onChange={(e) => updateHeaderRow(index, 'value', e.target.value)}
                    className={inputClass}
                  />
                  <button
                    onClick={() => setHeaderRows((rows) => rows.filter((_, i) => i !== index))}
                    className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 cursor-pointer"
                    aria-label="Remove header"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {errorMessage && (
              <p role="alert" className="text-red-400">
                {errorMessage}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3">
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer disabled:opacity-50"
          >
            Reset to default
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
