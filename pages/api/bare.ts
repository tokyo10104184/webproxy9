import { createBareServer } from '@tomphttp/bare-server-node';

const bare = createBareServer('/api/bare/');

export default async function handler(req: any, res: any) {
  // Simple health check
  if (req.url === '/api/bare/health') {
    return res.status(200).json({ status: 'ok', time: new Date().toISOString() });
  }

  try {
    if (bare.shouldRoute(req)) {
      bare.routeRequest(req, res);
    } else {
      res.status(400).send('Not a bare request');
    }
  } catch (err) {
    console.error('Bare server error:', err);
    res.status(500).send('Internal Server Error');
  }
}

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false,
  },
};
