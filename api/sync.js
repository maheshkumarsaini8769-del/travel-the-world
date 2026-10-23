const { put } = require('@vercel/blob');

const BLOB_URL = 'https://jsb9yiflvbh5srr7.public.blob.vercel-storage.com/store/data.json';

// In-memory cache for ultra-fast response across serverless invocations
let memoryCache = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 2500; // 2.5 seconds cache

async function getBackendData() {
  const now = Date.now();
  if (memoryCache && (now - lastFetchTime < CACHE_TTL_MS)) {
    return memoryCache;
  }

  try {
    // Add cache-busting timestamp so we never get stale cloud responses
    const fetchUrl = `${BLOB_URL}?t=${now}`;
    const res = await fetch(fetchUrl, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const json = await res.json();
      memoryCache = json;
      lastFetchTime = now;
      return json;
    }
  } catch (err) {
    console.warn('[Sync] Error fetching from blob:', err.message);
  }

  return memoryCache;
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  // GET: Client checks backend for latest data
  if (req.method === 'GET') {
    try {
      const serverStore = await getBackendData();
      if (!serverStore) {
        return res.status(200).json({
          status: 'ok',
          modified: false,
          version: 1,
          message: 'Store initializing'
        });
      }

      const clientVersion = req.query.version ? parseInt(req.query.version, 10) : 0;
      const serverVersion = serverStore.version || 1;

      // If client already has latest version -> 0 payload transferred
      if (clientVersion && clientVersion >= serverVersion) {
        return res.status(200).json({
          status: 'ok',
          modified: false,
          version: serverVersion,
          updatedAt: serverStore.updatedAt
        });
      }

      // Client is either opening for first time or backend has updated data
      return res.status(200).json({
        status: 'ok',
        modified: true,
        version: serverVersion,
        updatedAt: serverStore.updatedAt,
        data: serverStore.data
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST: Admin panel updates data (offers bar, settings, tours, etc.)
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (!body && typeof req.on === 'function') {
        body = await new Promise((resolve) => {
          let raw = '';
          req.on('data', chunk => { raw += chunk; });
          req.on('end', () => {
            try { resolve(JSON.parse(raw)); } catch (e) { resolve({}); }
          });
          req.on('error', () => resolve({}));
        });
      } else if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
      }

      const { key, payload, fullData } = body || {};

      let currentStore = await getBackendData();
      if (!currentStore || !currentStore.data) {
        currentStore = {
          version: 1,
          updatedAt: new Date().toISOString(),
          data: {}
        };
      }

      if (fullData && typeof fullData === 'object') {
        currentStore.data = { ...currentStore.data, ...fullData };
      } else if (key && payload !== undefined) {
        currentStore.data[key] = payload;
      }

      currentStore.version = (currentStore.version || 1) + 1;
      currentStore.updatedAt = new Date().toISOString();

      // Persist to Vercel Blob with overwrite
      await put('store/data.json', JSON.stringify(currentStore, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      });

      // Update memory cache
      memoryCache = currentStore;
      lastFetchTime = Date.now();

      return res.status(200).json({
        status: 'ok',
        version: currentStore.version,
        updatedAt: currentStore.updatedAt
      });
    } catch (err) {
      console.error('[Sync POST Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
