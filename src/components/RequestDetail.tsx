'use client';

import React, { useState } from 'react';
import { CapturedRequest } from '@/types';
import { Copy, Check, Terminal, FileCode, Sliders, Globe, Clock, ShieldCheck } from 'lucide-react';

interface RequestDetailProps {
  request: CapturedRequest | null;
  webhookUrl: string;
}

export function RequestDetail({ request, webhookUrl }: RequestDetailProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'query' | 'curl'>('body');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isPrettyJson, setIsPrettyJson] = useState(true);

  if (!request) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 bg-zinc-950">
        <FileCode className="h-12 w-12 text-zinc-700 mb-3" />
        <h3 className="text-sm font-semibold text-zinc-200">No Request Selected</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
          Select a request from the sidebar on the left or send an HTTP request to inspect headers, query params, and payload.
        </p>
      </div>
    );
  }

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const generateCurl = () => {
    let curl = `curl -X ${request.method} "${webhookUrl}"`;
    if (request.headers) {
      for (const [key, val] of Object.entries(request.headers)) {
        if (key.toLowerCase() !== 'host') {
          curl += ` \\\n  -H "${key}: ${val}"`;
        }
      }
    }
    if (request.body) {
      curl += ` \\\n  --data '${request.body.replace(/'/g, "'\\''")}'`;
    }
    return curl;
  };

  const formattedJsonBody = () => {
    if (!request.body) return null;
    try {
      const parsed = JSON.parse(request.body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return null;
    }
  };

  const parsedJson = formattedJsonBody();
  const displayBody = isPrettyJson && parsedJson ? parsedJson : request.body || '';

  const headerEntries = Object.entries(request.headers || {});
  const queryEntries = Object.entries(request.queryParams || {});

  const cleanIp = (ip: string | null) => {
    if (!ip) return '127.0.0.1';
    if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
    if (ip === '::1') return '127.0.0.1';
    return ip;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Top Request Info Bar */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded border uppercase font-mono bg-zinc-800 text-zinc-200 border-zinc-700">
            {request.method}
          </span>
          <span className="text-xs font-mono text-zinc-400">
            ID: <span className="text-zinc-200">{request.id}</span>
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs text-zinc-300 font-mono">
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            <span>{new Date(request.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Globe className="h-3.5 w-3.5 text-zinc-400" />
            <span>{cleanIp(request.ip)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/30 px-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('body')}
          className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer min-h-[44px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            activeTab === 'body'
              ? 'border-emerald-400 text-emerald-400 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileCode className="h-4 w-4" />
          <span>Body ({request.body ? `${new Blob([request.body]).size} B` : '0 B'})</span>
        </button>

        <button
          onClick={() => setActiveTab('headers')}
          className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer min-h-[44px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            activeTab === 'headers'
              ? 'border-emerald-400 text-emerald-400 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Headers ({headerEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('query')}
          className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer min-h-[44px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            activeTab === 'query'
              ? 'border-emerald-400 text-emerald-400 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Query Params ({queryEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('curl')}
          className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer min-h-[44px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            activeTab === 'curl'
              ? 'border-emerald-400 text-emerald-400 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>cURL Replay</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'body' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
              <span className="text-xs font-medium text-zinc-300">
                Payload Content {parsedJson && '(JSON)'}
              </span>
              <div className="flex items-center space-x-2">
                {parsedJson && (
                  <button
                    onClick={() => setIsPrettyJson(!isPrettyJson)}
                    className="text-xs px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer min-h-[36px]"
                  >
                    {isPrettyJson ? 'View Raw' : 'Format JSON'}
                  </button>
                )}
                {request.body && (
                  <button
                    onClick={() => copyToClipboard(displayBody, 'body')}
                    className="text-xs px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer min-h-[36px]"
                  >
                    {copiedSection === 'body' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {request.body ? (
              <pre className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre-wrap selection:bg-emerald-500/30">
                {displayBody}
              </pre>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-400 italic">
                (Empty body / No payload sent with this request)
              </div>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <span className="text-xs font-medium text-zinc-300">HTTP Headers</span>
              <button
                onClick={() =>
                  copyToClipboard(JSON.stringify(request.headers, null, 2), 'headers')
                }
                className="text-xs px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer min-h-[36px]"
              >
                {copiedSection === 'headers' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <div className="border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs font-mono divide-y divide-zinc-800">
                <thead className="bg-zinc-900 text-zinc-300">
                  <tr>
                    <th className="py-2.5 px-3 w-1/3 font-semibold">Header Name</th>
                    <th className="py-2.5 px-3 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 bg-zinc-950">
                  {headerEntries.map(([key, val]) => (
                    <tr key={key} className="hover:bg-zinc-900/50">
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold align-top">{key}</td>
                      <td className="py-2.5 px-3 text-zinc-200 break-all select-all">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'query' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <span className="text-xs font-medium text-zinc-300">Query Parameters</span>
              {queryEntries.length > 0 && (
                <button
                  onClick={() =>
                    copyToClipboard(JSON.stringify(request.queryParams, null, 2), 'query')
                  }
                  className="text-xs px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer min-h-[36px]"
                >
                  {copiedSection === 'query' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {queryEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 italic">
                (No query parameters provided)
              </div>
            ) : (
              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-mono divide-y divide-zinc-800">
                  <thead className="bg-zinc-900 text-zinc-300">
                    <tr>
                      <th className="py-2.5 px-3 w-1/3 font-semibold">Parameter</th>
                      <th className="py-2.5 px-3 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 bg-zinc-950">
                    {queryEntries.map(([key, val]) => (
                      <tr key={key} className="hover:bg-zinc-900/50">
                        <td className="py-2.5 px-3 text-emerald-400 font-semibold align-top">{key}</td>
                        <td className="py-2.5 px-3 text-zinc-200 break-all select-all">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'curl' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <span className="text-xs font-medium text-zinc-300">cURL Replay Command</span>
              <button
                onClick={() => copyToClipboard(generateCurl(), 'curl')}
                className="text-xs px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer min-h-[36px]"
              >
                {copiedSection === 'curl' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy cURL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre selection:bg-emerald-500/30">
              {generateCurl()}
            </pre>
            <p className="text-xs text-zinc-400">
              Copy and run this command directly in your terminal to replay the exact HTTP request.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
