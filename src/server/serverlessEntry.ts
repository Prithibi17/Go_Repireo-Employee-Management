import { getRequestListener } from '@hono/node-server';
import app from './app';

const listener = getRequestListener(app.fetch);

export default async function handler(req: any, res: any) {
  try {
    return await listener(req, res);
  } catch (err: any) {
    console.error('SERVERLESS EXCEPTION:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'Serverless Handler Exception',
        details: err?.message || String(err),
        stack: err?.stack,
      }));
    }
  }
}




