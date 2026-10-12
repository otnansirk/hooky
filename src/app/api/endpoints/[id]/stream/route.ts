import { NextRequest } from 'next/server';
import { eventEmitter } from '@/lib/events';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const eventName = `request:${id}`;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Initial connection established message
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ endpointId: id })}\n\n`));

      const onNewRequest = (requestData: unknown) => {
        try {
          const payload = `event: request\ndata: ${JSON.stringify(requestData)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // ignore write errors
        }
      };

      eventEmitter.on(eventName, onNewRequest);

      // Keepalive ping every 15 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        eventEmitter.off(eventName, onNewRequest);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      // Stream cancelled by reader
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
