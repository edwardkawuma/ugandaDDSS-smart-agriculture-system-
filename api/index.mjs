import app, { initBackend } from '../backend/server.js';

let readyPromise;

export default async function handler(req, res) {
  try {
    readyPromise ??= initBackend();
    await readyPromise;
    return app(req, res);
  } catch (error) {
    console.error('Vercel API bootstrap failed:', error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ message: 'API bootstrap failed' }));
  }
}
