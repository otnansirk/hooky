'use client';

import React from 'react';
import { CapturedRequest } from '@/types';
import { Search, Radio } from 'lucide-react';

interface RequestListProps {
  requests: CapturedRequest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  webhookUrl: string;
}

export function RequestList({
  requests,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
}: RequestListProps) {
  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'POST':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PUT':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'PATCH':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'DELETE':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const formatRelativeTime = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 3) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const methodMatch = r.method.toLowerCase().includes(q);
    const ipMatch = r.ip?.toLowerCase().includes(q);
    const bodyMatch = r.body?.toLowerCase().includes(q);
    return methodMatch || ipMatch || bodyMatch;
  });

  const formatIp = (ip: string | null) => {
    if (!ip) return '127.0.0.1';
    if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
    if (ip === '::1') return '127.0.0.1';
    return ip;
  };

  return (
    <div className="flex flex-col h-full border-r border-zinc-800 bg-zinc-950 w-full md:w-80 lg:w-96 flex-shrink-0">
      {/* Search Header */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/60">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search method, IP, body..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[44px] sm:min-h-0"
          />
        </div>
        <div className="flex justify-between items-center mt-2 px-1 text-xs text-zinc-400">
          <span>{filteredRequests.length} requests captured</span>
          {requests.length > 0 && <span className="text-zinc-400 font-mono">Max 100</span>}
        </div>
      </div>

      {/* Requests List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-64 text-zinc-400">
            <div className="relative flex items-center justify-center mb-3">
              <div className="absolute h-10 w-10 rounded-full bg-emerald-500/10 animate-ping" />
              <Radio className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-200">Listening for requests...</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-[220px]">
              Send any HTTP request to your endpoint URL to see it live here.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isSelected = req.id === selectedId;
            return (
              <button
                key={req.id}
                onClick={() => onSelect(req.id)}
                className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1.5 cursor-pointer min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isSelected
                    ? 'bg-zinc-800/90 border-l-2 border-emerald-400'
                    : 'hover:bg-zinc-900/70'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${getMethodBadgeClass(
                      req.method
                    )}`}
                  >
                    {req.method}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {formatRelativeTime(req.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span className="font-mono text-xs text-zinc-200 truncate max-w-[180px]">
                    {formatIp(req.ip)}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {req.body ? `${new Blob([req.body]).size} B` : '0 B'}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
