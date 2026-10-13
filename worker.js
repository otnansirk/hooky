import handler from './dist/server/index.js';
import { runWithExecutionContext } from 'vinext/shims/request-context';

export default {
  async fetch(request, env, ctx) {
    return runWithExecutionContext(ctx, () => handler(request, env, ctx));
  }
};
