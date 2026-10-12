import { EventEmitter } from 'events';

class HookyEmitter extends EventEmitter {}

// Global singleton across hot-reloads in development
const globalForEvents = globalThis as unknown as {
  hookyEmitter?: HookyEmitter;
};

export const eventEmitter = globalForEvents.hookyEmitter ?? new HookyEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.hookyEmitter = eventEmitter;
}

export function broadcastNewRequest(endpointId: string, data: unknown) {
  eventEmitter.emit(`request:${endpointId}`, data);
}
