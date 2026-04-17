import { createBareServer } from '@tomphttp/bare-server-node';

const bare = createBareServer('/api/bare/');

export default async function handler(req: any, res: any) {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    res.status(400).send('Not a bare request');
  }
}

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false,
  },
};
