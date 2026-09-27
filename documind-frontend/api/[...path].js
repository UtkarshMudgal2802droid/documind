export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // Extract path from the URL. req.url might be /api/token or /token
  const path = req.url.replace(/^\/api\/?/, '');
  const targetUrl = `http://13.61.187.63/${path}`;
  
  try {
    let body = undefined;
    
    // Vercel parses application/x-www-form-urlencoded into req.body as an object
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      if (typeof req.body === 'object' && req.headers['content-type']?.includes('x-www-form-urlencoded')) {
        body = new URLSearchParams(req.body).toString();
      } else if (typeof req.body === 'object') {
        body = JSON.stringify(req.body);
      } else {
        body = req.body;
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: '13.61.187.63',
        'x-forwarded-host': req.headers.host,
      },
      body,
    });

    // Only forward safe headers like Content-Type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
