'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CapturedRequest } from '@/types';
import { Header } from './Header';
import { RequestList } from './RequestList';
import { RequestDetail } from './RequestDetail';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface DashboardProps {
  endpointId: string;
  initialRequests?: CapturedRequest[];
}

export function Dashboard({ endpointId, initialRequests = [] }: DashboardProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<CapturedRequest[]>(initialRequests);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRequests.length > 0 ? initialRequests[0].id : null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const webhookUrl = `${origin || ''}/e/${endpointId}`;

  // Merge incoming requests by id, newest first
  const mergeRequests = useCallback((incoming: CapturedRequest[]) => {
    if (incoming.length === 0) return;
    setRequests((prev) => {
      const known = new Set(prev.map((r) => r.id));
      const fresh = incoming.filter((r) => !known.has(r.id));
      if (fresh.length === 0) return prev;
      return [...fresh, ...prev].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    setSelectedId((prev) => prev ?? incoming[0].id);
  }, []);

  // Fetch initial requests with explicit loading and error handling
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/endpoints/${endpointId}/requests`);
      if (res.ok) {
        const data = await res.json();
        const list: CapturedRequest[] = data.requests || [];
        setRequests(list);
        setSelectedId((prev) => prev ?? list[0]?.id ?? null);
      } else {
        setErrorMessage('Unable to load requests. Please check your network or try again.');
      }
    } catch {
      setErrorMessage('Network error while connecting to server.');
    } finally {
      setIsLoading(false);
    }
  }, [endpointId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Connect to SSE stream for instant updates (works with the single-process Node server)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      eventSource = new EventSource(`/api/endpoints/${endpointId}/stream`);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.addEventListener('connected', () => {
        setIsConnected(true);
      });

      eventSource.addEventListener('request', (event) => {
        try {
          mergeRequests([JSON.parse(event.data)]);
        } catch (e) {
          console.error('Failed to parse SSE payload:', e);
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
        if (eventSource) {
          eventSource.close();
        }
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [endpointId, mergeRequests]);

  // Poll for new requests as a fallback. The in-memory event emitter behind SSE only
  // reaches clients on the same process/isolate, so on Cloudflare Workers (or multiple
  // instances) SSE never delivers and polling is what keeps the list live.
  const latestCreatedAt = requests[0] ? new Date(requests[0].createdAt).getTime() : 0;
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(
          `/api/endpoints/${endpointId}/requests?since=${latestCreatedAt}`
        );
        if (res.ok) {
          const data = await res.json();
          mergeRequests(data.requests || []);
        }
      } catch {
        // transient network error, retry on next tick
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [endpointId, latestCreatedAt, mergeRequests]);

  const handleClear = async () => {
    if (!confirm('Are you sure you want to delete all captured requests for this endpoint?')) {
      return;
    }

    try {
      const res = await fetch(`/api/endpoints/${endpointId}/requests`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRequests([]);
        setSelectedId(null);
      } else {
        setErrorMessage('Failed to clear requests from server.');
      }
    } catch {
      setErrorMessage('Network error while attempting to clear requests.');
    }
  };

  const handleNewEndpoint = async () => {
    try {
      const res = await fetch('/api/endpoints', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        router.push(`/${data.id}`);
      }
    } catch {
      setErrorMessage('Failed to generate new endpoint.');
    }
  };

  const selectedRequest = requests.find((r) => r.id === selectedId) || null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950">
      <Header
        endpointId={endpointId}
        webhookUrl={webhookUrl}
        isConnected={isConnected}
        requestCount={requests.length}
        onClear={handleClear}
        onNewEndpoint={handleNewEndpoint}
      />

      {/* Global Error Banner if something went wrong */}
      {errorMessage && (
        <div
          role="alert"
          className="bg-red-950/80 border-b border-red-800/80 px-4 py-2 text-xs text-red-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={fetchRequests}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-red-100 text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && requests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-400 mb-2" />
          <p className="text-sm font-medium text-zinc-200">Loading requests...</p>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <RequestList
            requests={requests}
            selectedId={selectedId}
            onSelect={setSelectedId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            webhookUrl={webhookUrl}
          />

          <RequestDetail request={selectedRequest} webhookUrl={webhookUrl} />
        </div>
      )}
    </div>
  );
}
