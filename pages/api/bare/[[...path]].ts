import { createBareServer } from '@tomphttp/bare-server-node';

const bare = createBareServer('/api/bare/');

export default async function handler(req: any, res: any) {
  const url = req.url || '';

  // Health check
  if (url.includes('/health')) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
  }

  try {
    if (bare.shouldRoute(req)) {
      bare.routeRequest(req, res);
    } else {
      console.log('Bare: Not routing', url);
      res.status(400).send('Not a bare request');
    }
  } catch (err) {
    console.error('Bare server error:', err);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
}

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false,
  },
};
