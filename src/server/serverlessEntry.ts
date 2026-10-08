import { getRequestListener } from '@hono/node-server';
import app from './app';

const listener = getRequestListener(app.fetch);

export default function handler(req: any, res: any) {
  return listener(req, res);
}



