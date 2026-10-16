import {
  AISpawnObjectSpec,
  AskRealityMessage,
  RealityScanResult,
} from '../../types';
import { aiConfigService } from './aiConfig';

export interface IVisionLanguageProvider {
  analyzeObject(
    imageBase64: string,
    promptContext?: string,
    signal?: AbortSignal
  ): Promise<RealityScanResult>;

  askReality(
    imageBase64: string,
    question: string,
    history?: AskRealityMessage[],
    signal?: AbortSignal
  ): Promise<string>;

  generateObjectSpec(
    prompt: string,
    context?: string,
    signal?: AbortSignal
  ): Promise<AISpawnObjectSpec>;

  testConnection(signal?: AbortSignal): Promise<{ ok: boolean; message: string }>;
}

const OBJECT_ANALYSIS_SCHEMA_PROMPT = `
You are the Reality.exe Spatial Vision Intelligence Engine.
Analyze the provided camera image of a physical object selected by the user.

Return ONLY a strictly valid JSON object matching this exact schema:
{
  "objectName": "Name or specific title of the object",
  "category": "E.g. Computer Peripheral, Beverage Container, Electronic Device, Tool, Decor",
  "shortDescription": "2-3 sentence description of what is visible",
  "visibleAttributes": ["Color", "Shape", "Texture", "Form factor"],
  "materialEstimate": "Estimated material (e.g. Matte Polycarbonate, Brushed Aluminum, Ceramic, Glass, Uncertain)",
  "potentialUseCases": ["Use case 1", "Use case 2", "Use case 3"],
  "interestingFacts": ["Fascinating fact or engineering note 1", "Fact 2"],
  "confidenceNote": "Note regarding identification certainty (e.g. High confidence based on distinct keycaps, or Moderate confidence due to angle)",
  "suggestedInteractions": ["Create 3D holographic twin", "Examine ergonomics", "Ask follow-up question"],
  "conciseSummary": "1 sentence technical summary of the object",
  "suggested3DSpec": {
    "type": "cube|sphere|ring|octahedron|torus|cylinder|cone",
    "name": "Holographic [ObjectName]",
    "description": "Spatial 3D representation",
    "scale": [1.0, 1.0, 1.0],
    "color": "#00f0ff",
    "emissive": "#003344",
    "wireframe": false,
    "animation": "float|spin|pulse|orbit|none"
  }
}
Do not include markdown ticks, do not fabricate exact specs if uncertain, explicitly note uncertainty where applicable.
`;

const OBJECT_GENERATION_SCHEMA_PROMPT = `
You are the Reality.exe 3D Object Synthesis Engine.
Transform the user's natural language request into a validated 3D procedural object specification for Three.js.

Return ONLY a strictly valid JSON object:
{
  "type": "cube|sphere|ring|octahedron|torus|cylinder|cone",
  "name": "Creative name for object",
  "description": "Short description of the synthetic object",
  "scale": [x_float_between_0.4_and_3.0, y_float, z_float],
  "color": "#hexcode",
  "emissive": "#hexcode_dimmer_glow",
  "wireframe": boolean,
  "animation": "float|spin|pulse|orbit|none"
}
Ensure scale values are within [0.4, 3.0]. Choose luminous neon/cyber colors like #00f0ff, #38bdf8, #818cf8, #34d399, #f43f5e, #fbbf24, #f8fafc.
`;

/**
 * Google Gemini Multimodal Provider
 */
export class GeminiProvider implements IVisionLanguageProvider {
  private getEndpoint(model: string, apiKey: string): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  }

  public async analyzeObject(
    imageBase64: string,
    promptContext: string = '',
    signal?: AbortSignal
  ): Promise<RealityScanResult> {
    const config = aiConfigService.getConfig();
    if (!config.apiKey) {
      throw new Error('Gemini API key is not configured. Please enter your key in System Settings.');
    }

    const prompt = `${OBJECT_ANALYSIS_SCHEMA_PROMPT}\n${promptContext ? `User Context/Focus: ${promptContext}` : ''}`;
    const url = this.getEndpoint(config.model || 'gemini-2.5-flash', config.apiKey);

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: config.temperature ?? 0.2,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Gemini API error (${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch (e) {
        msg = errText || msg;
      }
      throw new Error(msg);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error('Empty response from Gemini vision model.');
    }

    return this.parseAndValidateScanResult(rawContent);
  }

  public async askReality(
    imageBase64: string,
    question: string,
    history: AskRealityMessage[] = [],
    signal?: AbortSignal
  ): Promise<string> {
    const config = aiConfigService.getConfig();
    if (!config.apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const url = this.getEndpoint(config.model || 'gemini-2.5-flash', config.apiKey);

    const historyParts = history.slice(-6).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const contents = [
      ...historyParts,
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          {
            text: `You are Ask Reality, a spatial computer vision assistant. Answer concisely and technically based on the user's camera feed.\nQuestion: ${question}`,
          },
        ],
      },
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
  }

  public async generateObjectSpec(
    prompt: string,
    context?: string,
    signal?: AbortSignal
  ): Promise<AISpawnObjectSpec> {
    const config = aiConfigService.getConfig();
    if (!config.apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const url = this.getEndpoint(config.model || 'gemini-2.5-flash', config.apiKey);
    const systemPrompt = `${OBJECT_GENERATION_SCHEMA_PROMPT}\n${context ? `Scene Context: ${context}` : ''}\nRequest: "${prompt}"`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to generate object spec: ${response.statusText}`);
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return this.parseAndValidateSpec(raw, prompt);
  }

  public async testConnection(signal?: AbortSignal): Promise<{ ok: boolean; message: string }> {
    const config = aiConfigService.getConfig();
    if (!config.apiKey) {
      return { ok: false, message: 'API key is missing.' };
    }
    try {
      const url = this.getEndpoint(config.model || 'gemini-2.5-flash', config.apiKey);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Ping. Reply with "pong".' }] }],
        }),
        signal,
      });
      if (res.ok) {
        return { ok: true, message: 'Successfully connected to Google Gemini vision service!' };
      }
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err.error?.message || `HTTP ${res.status}` };
    } catch (e: any) {
      return { ok: false, message: e.message || 'Connection failed' };
    }
  }

  private parseAndValidateScanResult(raw: string): RealityScanResult {
    let clean = raw.trim();
    if (clean.startsWith('```json')) clean = clean.slice(7);
    if (clean.endsWith('```')) clean = clean.slice(0, -3);

    const parsed = JSON.parse(clean);
    return {
      id: `scan-${Date.now()}`,
      timestamp: Date.now(),
      objectName: parsed.objectName || 'Unidentified Object',
      category: parsed.category || 'General Object',
      shortDescription: parsed.shortDescription || 'No description available.',
      visibleAttributes: Array.isArray(parsed.visibleAttributes) ? parsed.visibleAttributes : [],
      materialEstimate: parsed.materialEstimate || 'Uncertain',
      potentialUseCases: Array.isArray(parsed.potentialUseCases) ? parsed.potentialUseCases : [],
      interestingFacts: Array.isArray(parsed.interestingFacts) ? parsed.interestingFacts : [],
      confidenceNote: parsed.confidenceNote || 'Standard confidence estimation.',
      suggestedInteractions: Array.isArray(parsed.suggestedInteractions) ? parsed.suggestedInteractions : ['Create 3D Model'],
      conciseSummary: parsed.conciseSummary || parsed.shortDescription || '',
      suggested3DSpec: parsed.suggested3DSpec,
    };
  }

  private parseAndValidateSpec(raw: string, fallbackName: string): AISpawnObjectSpec {
    let clean = raw.trim();
    if (clean.startsWith('```json')) clean = clean.slice(7);
    if (clean.endsWith('```')) clean = clean.slice(0, -3);

    const parsed = JSON.parse(clean);
    const validTypes = ['cube', 'sphere', 'ring', 'octahedron', 'torus', 'cylinder', 'cone'];
    const type = validTypes.includes(parsed.type) ? parsed.type : 'sphere';

    return {
      type,
      name: parsed.name || fallbackName,
      description: parsed.description || 'Procedural AI synthesis',
      scale: Array.isArray(parsed.scale) && parsed.scale.length === 3
        ? [
            Math.max(0.3, Math.min(3.0, parsed.scale[0])),
            Math.max(0.3, Math.min(3.0, parsed.scale[1])),
            Math.max(0.3, Math.min(3.0, parsed.scale[2])),
          ]
        : [1, 1, 1],
      color: /^#[0-9a-fA-F]{6}$/.test(parsed.color) ? parsed.color : '#00f0ff',
      emissive: /^#[0-9a-fA-F]{6}$/.test(parsed.emissive) ? parsed.emissive : '#003344',
      wireframe: Boolean(parsed.wireframe),
      animation: ['float', 'spin', 'pulse', 'orbit', 'none'].includes(parsed.animation)
        ? parsed.animation
        : 'float',
    };
  }
}

/**
 * OpenAI Multimodal Provider
 */
export class OpenAIProvider implements IVisionLanguageProvider {
  public async analyzeObject(
    imageBase64: string,
    promptContext: string = '',
    signal?: AbortSignal
  ): Promise<RealityScanResult> {
    const config = aiConfigService.getConfig();
    if (!config.apiKey) throw new Error('OpenAI API key is missing.');

    const endpoint = config.customEndpoint || 'https://api.openai.com/v1/chat/completions';
    const prompt = `${OBJECT_ANALYSIS_SCHEMA_PROMPT}\n${promptContext ? `User Context: ${promptContext}` : ''}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        temperature: config.temperature ?? 0.2,
      }),
      signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI error: ${res.statusText}`);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(raw);
    return {
      id: `scan-${Date.now()}`,
      timestamp: Date.now(),
      objectName: parsed.objectName || 'Unidentified Object',
      category: parsed.category || 'General Object',
      shortDescription: parsed.shortDescription || 'No description available.',
      visibleAttributes: parsed.visibleAttributes || [],
      materialEstimate: parsed.materialEstimate || 'Uncertain',
      potentialUseCases: parsed.potentialUseCases || [],
      interestingFacts: parsed.interestingFacts || [],
      confidenceNote: parsed.confidenceNote || 'Identified via OpenAI Vision.',
      suggestedInteractions: parsed.suggestedInteractions || ['Spawn 3D Twin'],
      conciseSummary: parsed.conciseSummary || parsed.shortDescription || '',
      suggested3DSpec: parsed.suggested3DSpec,
    };
  }

  public async askReality(
    imageBase64: string,
    question: string,
    history: AskRealityMessage[] = [],
    signal?: AbortSignal
  ): Promise<string> {
    const config = aiConfigService.getConfig();
    const endpoint = config.customEndpoint || 'https://api.openai.com/v1/chat/completions';

    const messages: any[] = history.slice(-6).map((m) => ({
      role: m.role,
      content: m.text,
    }));

    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: question },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ],
    });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages,
      }),
      signal,
    });

    if (!res.ok) throw new Error(`OpenAI request failed: ${res.statusText}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'No response generated.';
  }

  public async generateObjectSpec(
    prompt: string,
    context?: string,
    signal?: AbortSignal
  ): Promise<AISpawnObjectSpec> {
    const config = aiConfigService.getConfig();
    const endpoint = config.customEndpoint || 'https://api.openai.com/v1/chat/completions';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `${OBJECT_GENERATION_SCHEMA_PROMPT}\n${context ? `Context: ${context}` : ''}\nRequest: "${prompt}"`,
          },
        ],
        response_format: { type: 'json_object' },
      }),
      signal,
    });

    if (!res.ok) throw new Error(`OpenAI spec generation failed: ${res.statusText}`);
    const data = await res.json();
    return JSON.parse(data.choices?.[0]?.message?.content);
  }

  public async testConnection(signal?: AbortSignal): Promise<{ ok: boolean; message: string }> {
    const config = aiConfigService.getConfig();
    if (!config.apiKey) return { ok: false, message: 'API key is missing.' };
    try {
      const endpoint = config.customEndpoint || 'https://api.openai.com/v1/models';
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        signal,
      });
      return { ok: res.ok, message: res.ok ? 'Connected to OpenAI!' : `HTTP ${res.status}` };
    } catch (e: any) {
      return { ok: false, message: e.message };
    }
  }
}

/**
 * Local Backend Proxy Provider (Forwarding through /api/ai/*)
 */
export class ProxyProvider implements IVisionLanguageProvider {
  public async analyzeObject(
    imageBase64: string,
    promptContext: string = '',
    signal?: AbortSignal
  ): Promise<RealityScanResult> {
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, context: promptContext }),
      signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Proxy error ${res.status}`);
    }
    return res.json();
  }

  public async askReality(
    imageBase64: string,
    question: string,
    history: AskRealityMessage[] = [],
    signal?: AbortSignal
  ): Promise<string> {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, question, history }),
      signal,
    });
    if (!res.ok) throw new Error(`Proxy error ${res.status}`);
    const data = await res.json();
    return data.answer;
  }

  public async generateObjectSpec(
    prompt: string,
    context?: string,
    signal?: AbortSignal
  ): Promise<AISpawnObjectSpec> {
    const res = await fetch('/api/ai/spawn-spec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context }),
      signal,
    });
    if (!res.ok) throw new Error(`Proxy error ${res.status}`);
    return res.json();
  }

  public async testConnection(signal?: AbortSignal): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch('/api/ai/test', { signal });
      const data = await res.json();
      return { ok: res.ok && data.ok, message: data.message || 'Proxy online.' };
    } catch (e: any) {
      return { ok: false, message: `Cannot reach local proxy: ${e.message}` };
    }
  }
}

/**
 * Offline Heuristic Simulation Provider
 * Simulates high-fidelity multimodal intelligence when no API key is available.
 */
export class SimulatedProvider implements IVisionLanguageProvider {
  public async analyzeObject(
    _imageBase64: string,
    promptContext: string = '',
    _signal?: AbortSignal
  ): Promise<RealityScanResult> {
    // Artificial 600ms latency to simulate real network request
    await new Promise((r) => setTimeout(r, 650));

    // Diverse contextual catalog based on prompt or randomized selection
    const mockCatalog = [
      {
        objectName: 'Mechanical Desk Keyboard',
        category: 'Computer Peripheral / Ergonomics',
        shortDescription: 'A compact mechanical keyboard featuring low-profile keycaps and an aluminum frame.',
        visibleAttributes: ['Dark slate color', 'Tenkeyless layout', 'Subtle matte finish'],
        materialEstimate: 'Anodized Aluminum & PBT Plastic',
        potentialUseCases: ['High-speed tactile typing', 'Programming & Software Development', 'Gaming interaction'],
        interestingFacts: ['Mechanical switches use individual physical leaf contacts, typically rated for 50-100M keystrokes.'],
        confidenceNote: 'Simulated heuristic estimation (local mode).',
        suggestedInteractions: ['Spawn virtual low-poly keyboard', 'Map spatial key bindings', 'Examine switch travel'],
        conciseSummary: 'Standard ergonomic mechanical input interface.',
        suggested3DSpec: {
          type: 'cube' as const,
          name: 'Holo Keyboard Grid',
          description: 'Holographic input lattice',
          scale: [2.2, 0.35, 1.1] as [number, number, number],
          color: '#38bdf8',
          emissive: '#0369a1',
          wireframe: false,
          animation: 'float' as const,
        },
      },
      {
        objectName: 'Ceramic Coffee Mug',
        category: 'Beverage Container / Tableware',
        shortDescription: 'A cylindrical ceramic mug with curved ergonomic handle resting on the physical work surface.',
        visibleAttributes: ['Cylindrical form', 'High thermal mass', 'Reflective glaze'],
        materialEstimate: 'High-fire Glazed Stoneware / Ceramic',
        potentialUseCases: ['Hot beverage containment', 'Desktop thermal reservoir', 'Desk organizer'],
        interestingFacts: ['Glazed ceramic contains microscopic vitrified silica that prevents liquid permeability.'],
        confidenceNote: 'Simulated heuristic estimation (local mode).',
        suggestedInteractions: ['Spawn holographic cylinder twin', 'Monitor fluid level', 'Check temperature simulation'],
        conciseSummary: 'Vitrified ceramic thermal containment vessel.',
        suggested3DSpec: {
          type: 'cylinder' as const,
          name: 'Thermal Cylinder',
          description: 'Cylindrical holographic vessel',
          scale: [0.9, 1.2, 0.9] as [number, number, number],
          color: '#00f0ff',
          emissive: '#042f2e',
          wireframe: false,
          animation: 'spin' as const,
        },
      },
      {
        objectName: 'Wireless Optical Mouse',
        category: 'Input Peripheral / Sensor Device',
        shortDescription: 'An ergonomic wireless pointing device equipped with optical sensor and scroll wheel.',
        visibleAttributes: ['Contoured ergonomic curve', 'Matte elastomer coating', 'Optical sensor port'],
        materialEstimate: 'Injection-molded ABS Plastic & Textured Rubber',
        potentialUseCases: ['2D Cartesian cursor navigation', 'Gesture auxiliary trigger', 'Spatial calibration target'],
        interestingFacts: ['Modern optical mice use high-speed micro-cameras capturing 10,000+ frames per second to track surface irregularities.'],
        confidenceNote: 'Simulated heuristic estimation (local mode).',
        suggestedInteractions: ['Spawn spatial pointer twin', 'Test sensor latency', 'Calibrate cursor scale'],
        conciseSummary: 'Optical motion-tracking desktop input hardware.',
        suggested3DSpec: {
          type: 'sphere' as const,
          name: 'Optic Orb',
          description: 'Optical sensor beacon',
          scale: [1.0, 0.6, 1.3] as [number, number, number],
          color: '#22d3ee',
          emissive: '#164e63',
          wireframe: false,
          animation: 'pulse' as const,
        },
      },
    ];

    const chosen = promptContext.toLowerCase().includes('keyboard')
      ? mockCatalog[0]
      : promptContext.toLowerCase().includes('mug') || promptContext.toLowerCase().includes('cup')
      ? mockCatalog[1]
      : mockCatalog[Math.floor(Math.random() * mockCatalog.length)];

    return {
      id: `scan-${Date.now()}`,
      timestamp: Date.now(),
      ...chosen,
    };
  }

  public async askReality(
    _imageBase64: string,
    question: string,
    _history: AskRealityMessage[] = [],
    _signal?: AbortSignal
  ): Promise<string> {
    await new Promise((r) => setTimeout(r, 500));
    const q = question.toLowerCase();

    if (q.includes('desk') || q.includes('scene') || q.includes('visible')) {
      return 'In your physical environment, I observe a desktop workspace containing typical peripherals (keyboard, pointing device), stationery or vessels, illuminated by ambient indoor room lighting.';
    }
    if (q.includes('purpose') || q.includes('use')) {
      return 'The physical object appears intended for desktop productivity and human-computer interaction, facilitating ergonomic manual control.';
    }
    if (q.includes('organize') || q.includes('clean')) {
      return 'To optimize your spatial workspace, consider placing primary input devices within 30cm of your resting arm posture, keeping holographic projections in the upper peripheral visual field.';
    }
    return `[Simulated Vision Analysis] Regarding "${question}": The physical environment shows clear geometry suitable for spatial computing overlays. Configure a Gemini API key in Settings for live cloud multimodal reasoning.`;
  }

  public async generateObjectSpec(
    prompt: string,
    _context?: string,
    _signal?: AbortSignal
  ): Promise<AISpawnObjectSpec> {
    await new Promise((r) => setTimeout(r, 400));
    const p = prompt.toLowerCase();

    if (p.includes('ring') || p.includes('torus') || p.includes('donut')) {
      return {
        type: 'torus',
        name: 'Quantum Flux Ring',
        description: 'Synthesized parametric torus',
        scale: [1.2, 1.2, 1.2],
        color: '#00f0ff',
        emissive: '#042f2e',
        wireframe: false,
        animation: 'spin',
      };
    }
    if (p.includes('cube') || p.includes('box') || p.includes('matrix')) {
      return {
        type: 'cube',
        name: 'Voxel Matrix',
        description: 'Synthesized cubic array',
        scale: [1.1, 1.1, 1.1],
        color: '#38bdf8',
        emissive: '#075985',
        wireframe: true,
        animation: 'pulse',
      };
    }
    if (p.includes('prism') || p.includes('crystal') || p.includes('gem')) {
      return {
        type: 'octahedron',
        name: 'Hyper Crystal',
        description: 'Synthesized refractive octahedron',
        scale: [1.3, 1.3, 1.3],
        color: '#818cf8',
        emissive: '#3730a3',
        wireframe: false,
        animation: 'float',
      };
    }

    return {
      type: 'sphere',
      name: `Synthesized ${prompt.slice(0, 16)}`,
      description: `AI procedural object created from: "${prompt}"`,
      scale: [1.0, 1.0, 1.0],
      color: '#22d3ee',
      emissive: '#0e7490',
      wireframe: false,
      animation: 'float',
    };
  }

  public async testConnection(_signal?: AbortSignal): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: 'Local Heuristic Simulator active (no API key required).' };
  }
}
