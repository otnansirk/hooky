'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal, Trash2, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  endpointId: string;
  webhookUrl: string;
  isConnected: boolean;
  requestCount: number;
  onClear: () => void;
  onNewEndpoint: () => void;
  onOpenSettings: () => void;
}

export function Header({
  endpointId,
  webhookUrl,
  isConnected,
  requestCount,
  onClear,
  onNewEndpoint,
  onOpenSettings,
}: HeaderProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const sampleCurl = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello from Hooky!", "timestamp": "${new Date().toISOString()}"}'`;

  const copyToClipboard = (text: string, type: 'url' | 'curl') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Status */}
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="flex items-center space-x-2.5 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px] sm:min-h-0 py-1"
          >
            <div className="h-8 w-8 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700 transition-colors relative">
              <Image
                src="/logo.png"
                alt="Hooky Logo"
                width={32}
                height={32}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <span className="font-bold text-lg text-zinc-100 tracking-tight">Hooky</span>
          </Link>

          <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono">
            {endpointId}
          </span>

          <div className="flex items-center space-x-2 pl-2 text-xs">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-zinc-400 hidden sm:inline">
              {isConnected ? 'Real-Time Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Webhook URL Input & Quick Actions */}
        <div className="flex items-center flex-1 max-w-xl mx-0 md:mx-4">
          <div className="relative flex items-center w-full">
            <span className="absolute left-3 text-xs font-mono text-zinc-400 select-none hidden sm:inline">
              URL:
            </span>
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 sm:py-1.5 pl-3 sm:pl-12 pr-20 text-xs font-mono text-zinc-200 select-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px] sm:min-h-0"
            />
            <button
              onClick={() => copyToClipboard(webhookUrl, 'url')}
              className="absolute right-1 px-3 py-1.5 sm:py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[38px] sm:min-h-0 cursor-pointer"
              title="Copy Webhook URL"
            >
              {copiedUrl ? (
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
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => copyToClipboard(sampleCurl, 'curl')}
            className="px-3 py-2 sm:py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px] sm:min-h-0 cursor-pointer"
            title="Copy test cURL command"
          >
            {copiedCurl ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Terminal className="h-3.5 w-3.5 text-zinc-400" />
            )}
            <span className="hidden sm:inline">Copy cURL</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="px-3 py-2 sm:py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px] sm:min-h-0 cursor-pointer"
            title="Customize the response returned to webhook senders"
          >
            <Settings className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Response</span>
          </button>

          {requestCount > 0 && (
            <button
              onClick={onClear}
              className="px-3 py-2 sm:py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-red-950/40 hover:border-red-800/50 text-zinc-300 hover:text-red-400 text-xs flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-h-[44px] sm:min-h-0 cursor-pointer"
              title="Clear all captured requests"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <button
            onClick={onNewEndpoint}
            className="px-3.5 py-2 sm:py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[44px] sm:min-h-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New URL</span>
          </button>
        </div>
      </div>
    </header>
  );
}
