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

  // Fetch initial requests with explicit loading and error handling
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/endpoints/${endpointId}/requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        if (data.requests && data.requests.length > 0 && !selectedId) {
          setSelectedId(data.requests[0].id);
        }
      } else {
        setErrorMessage('Unable to load requests. Please check your network or try again.');
      }
    } catch {
      setErrorMessage('Network error while connecting to server.');
    } finally {
      setIsLoading(false);
    }
  }, [endpointId, selectedId]);

  // Connect to SSE stream
  useEffect(() => {
    fetchRequests();

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
          const newReq: CapturedRequest = JSON.parse(event.data);
          setRequests((prev) => {
            if (prev.some((r) => r.id === newReq.id)) return prev;
            return [newReq, ...prev];
          });
          setSelectedId((prev) => prev ?? newReq.id);
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
  }, [endpointId, fetchRequests]);

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
