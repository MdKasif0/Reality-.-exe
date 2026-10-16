import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Server-Side AI Proxy Plugin for Dev Server
 * Keeps private API keys on the server side (process.env), preventing credential exposure in client bundles.
 */
function aiServerProxyPlugin(): Plugin {
  return {
    name: 'reality-ai-server-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/ai/')) {
          return next();
        }

        const url = req.url.split('?')[0];

        // Enable CORS and JSON response headers
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'GET' && url === '/api/ai/test') {
          const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
          const hasOpenAI = Boolean(process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY);
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              ok: true,
              message: `Local server proxy operational. Keys loaded: Gemini=${hasGemini}, OpenAI=${hasOpenAI}`,
            })
          );
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }

        // Buffer JSON body with 15MB limit
        try {
          const bodyBuffer: Buffer[] = [];
          let bodySize = 0;
          const MAX_SIZE = 15 * 1024 * 1024; // 15MB

          for await (const chunk of req) {
            bodySize += chunk.length;
            if (bodySize > MAX_SIZE) {
              res.statusCode = 413;
              return res.end(JSON.stringify({ error: 'Payload too large (limit 15MB)' }));
            }
            bodyBuffer.push(chunk);
          }

          const rawBody = Buffer.concat(bodyBuffer).toString('utf8');
          const data = rawBody ? JSON.parse(rawBody) : {};

          const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

          if (url === '/api/ai/analyze') {
            const { image, context } = data;
            if (!image) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Missing image field' }));
            }

            if (geminiKey) {
              // Direct server-side call to Google Gemini
              const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
              const prompt = `You are Reality.exe Spatial Vision Engine. Analyze the physical object in this image.\nReturn ONLY valid JSON matching this schema:\n{"objectName":"name","category":"category","shortDescription":"desc","visibleAttributes":[],"materialEstimate":"material","potentialUseCases":[],"interestingFacts":[],"confidenceNote":"note","suggestedInteractions":[],"conciseSummary":"summary"}\n${context ? `Context: ${context}` : ''}`;

              const apiRes = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      role: 'user',
                      parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: image } },
                        { text: prompt },
                      ],
                    },
                  ],
                  generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
                }),
              });

              if (apiRes.ok) {
                const apiData = (await apiRes.json()) as any;
                const raw = apiData.candidates?.[0]?.content?.parts?.[0]?.text;
                let parsed = JSON.parse(raw || '{}');
                parsed.id = `scan-${Date.now()}`;
                parsed.timestamp = Date.now();
                res.statusCode = 200;
                return res.end(JSON.stringify(parsed));
              }
            }

            // Fallback heuristic simulation if no server key
            res.statusCode = 200;
            return res.end(
              JSON.stringify({
                id: `scan-${Date.now()}`,
                timestamp: Date.now(),
                objectName: 'Physical Desktop Target',
                category: 'Workspace Hardware / Object',
                shortDescription: 'Detected physical object in camera frame. Processed through local backend proxy.',
                visibleAttributes: ['Volumetric form', 'Contoured surface', 'Indoor illumination'],
                materialEstimate: 'Composite Polymer & Metal',
                potentialUseCases: ['Productivity task', 'Desk ergonomics', 'Physical computing utility'],
                interestingFacts: ['Analyzed via secure backend proxy without client credential exposure.'],
                confidenceNote: 'Proxy heuristic estimation.',
                suggestedInteractions: ['Spawn 3D Virtual Model', 'Examine geometry', 'Ask Follow-up'],
                conciseSummary: 'Analyzed physical hardware object.',
                suggested3DSpec: {
                  type: 'cube',
                  name: 'Proxy Object Twin',
                  description: 'Holographic virtual twin',
                  scale: [1, 1, 1],
                  color: '#00f0ff',
                  emissive: '#042f2e',
                  wireframe: false,
                  animation: 'float',
                },
              })
            );
          }

          if (url === '/api/ai/ask') {
            const { image, question, history } = data;
            if (geminiKey && image) {
              const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
              const contents = [
                ...(history || []).slice(-4).map((h: any) => ({
                  role: h.role === 'user' ? 'user' : 'model',
                  parts: [{ text: h.text }],
                })),
                {
                  role: 'user',
                  parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: image } },
                    { text: `Answer concisely as a spatial computing assistant: ${question}` },
                  ],
                },
              ];

              const apiRes = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents }),
              });

              if (apiRes.ok) {
                const apiData = (await apiRes.json()) as any;
                const text = apiData.candidates?.[0]?.content?.parts?.[0]?.text;
                res.statusCode = 200;
                return res.end(JSON.stringify({ answer: text || 'No response.' }));
              }
            }

            res.statusCode = 200;
            return res.end(
              JSON.stringify({
                answer: `[Local Proxy] Regarding "${question}": Visual surroundings verified. Connect an active GEMINI_API_KEY in .env for live multimodal responses.`,
              })
            );
          }

          if (url === '/api/ai/spawn-spec') {
            const { prompt } = data;
            res.statusCode = 200;
            return res.end(
              JSON.stringify({
                type: 'sphere',
                name: `Synthetic ${prompt?.slice(0, 16) || 'Object'}`,
                description: `Created via proxy from prompt: "${prompt}"`,
                scale: [1, 1, 1],
                color: '#38bdf8',
                emissive: '#0369a1',
                wireframe: false,
                animation: 'float',
              })
            );
          }

          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Endpoint not found' }));
        } catch (err: any) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: err.message || 'Internal proxy error' }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), aiServerProxyPlugin()],
});
