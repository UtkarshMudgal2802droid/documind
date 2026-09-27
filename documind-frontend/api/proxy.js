export const config = {
  api: {
    bodyParser: false, // Disable Vercel's body parser to allow raw streams (crucial for file uploads)
  },
};

export default async function handler(req, res) {
  // Extract path from the URL. e.g. /api/documents/upload -> documents/upload
  // Note: req.url in Vercel sometimes includes the query string, we'll keep it.
  const path = req.url.replace(/^\/api\/?/, '');
  const targetUrl = `http://13.61.187.63/${path}`;
  
  try {
    const fetchOptions = {
      method: req.method,
      headers: { ...req.headers },
    };

    // Forward the host header properly
    fetchOptions.headers['host'] = '13.61.187.63';
    fetchOptions.headers['x-forwarded-host'] = req.headers.host;

    // Pipe the raw body stream if it's a POST/PUT/PATCH
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = req;
      fetchOptions.duplex = 'half'; // Required for Node 18+ fetch with streams
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Only forward safe headers (avoid gzip conflicts)
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    // For file downloads or large responses, we could pipe, but text/json is fine for this app
    if (contentType && contentType.includes('application/json')) {
        const data = await response.text();
        res.status(response.status).send(data);
    } else {
        const buffer = await response.arrayBuffer();
        res.status(response.status).send(Buffer.from(buffer));
    }
    
  } catch (error) {
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
