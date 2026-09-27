import http from 'http';
import https from 'https';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req, res) {
  const path = req.url.replace(/^\/api\/?/, '');
  // Default to the EC2 server IP in case the Vercel environment variable isn't set yet
  const backendBase = process.env.BACKEND_API_URL || 'http://13.61.187.63';
  const targetUrl = new URL(`${backendBase}/${path}`);
  
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: { ...req.headers },
  };

  // Delete forbidden headers
  delete options.headers.host;
  options.headers['x-forwarded-host'] = req.headers.host;

  const client = targetUrl.protocol === 'https:' ? https : http;

  const proxyReq = client.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    res.status(500).json({ error: 'Proxy error', details: err.message });
  });

  // Pipe the request body
  req.pipe(proxyReq, { end: true });
}
