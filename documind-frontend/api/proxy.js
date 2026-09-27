import http from 'http';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req, res) {
  const backendUrl = process.env.BACKEND_API_URL;
  
  if (!backendUrl) {
    res.status(500).json({ error: "Missing BACKEND_API_URL secret" });
    return;
  }

  // Clean the URL just in case there are http:// or trailing slashes
  const cleanBackendUrl = backendUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Remove the /api prefix so it matches the backend routes (e.g. /token)
  const path = req.url.replace(/^\/api/, '');

  const options = {
    hostname: cleanBackendUrl,
    port: 80,
    path: path,
    method: req.method,
    headers: {
      ...req.headers,
      // CRITICAL: Override the Host header so AWS doesn't drop the connection!
      host: cleanBackendUrl,
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy Error:', err);
    res.status(502).json({ error: "Bad Gateway - Proxy failed to reach AWS backend." });
  });

  // Stream the original request directly to AWS (supports large PDF uploads!)
  req.pipe(proxyReq, { end: true });
}
