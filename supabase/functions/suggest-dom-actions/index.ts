// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-last-action-category',
}

interface DOMElement {
  id: string;
  description: string;
  x: number;
  y: number;
  elementType: string;
  confidence: number;
  text?: string;
  role?: string;
  ariaLabel?: string;
  path?: string;
}

interface RequestBody {
  elements: DOMElement[];
}

interface AgentAction {
  id: string;
  description: string;
  x: number;
  y: number;
  elementType: string;
  confidence: number;
  category: 'navigation' | 'content' | 'action';
}

// Simple in-memory cache with TTL
const cache = new Map<string, { data: AgentAction[]; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

// Clean up old cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);

// Helper to generate cache key
function generateCacheKey(elements: DOMElement[], lastActionCategory: string | null): string {
  // Use paths and last action category as cache key
  return JSON.stringify({
    paths: elements.map(e => e.path),
    lastActionCategory
  });
}

// Preprocess elements to reduce token usage
function preprocessElements(elements: DOMElement[]): DOMElement[] {
  return elements.map(element => ({
    id: element.id,
    description: element.description,
    x: element.x,
    y: element.y,
    elementType: element.elementType,
    path: element.path,
    confidence: element.confidence,
    // Only include these if they add new information
    ...(element.text !== element.description && { text: element.text }),
    ...(element.role !== element.elementType && { role: element.role }),
    ...(element.ariaLabel !== element.description && { ariaLabel: element.ariaLabel })
  }));
}

async function filterImportantElements(openai: OpenAI, elements: DOMElement[]): Promise<DOMElement[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a DOM element analyzer. Return ONLY a JSON array of indices of important elements.
Example response: {"indices": [0, 1, 2]}
Important: 
1. Response must be valid JSON
2. Only include the indices array
3. No explanations or additional text
4. Max 20 indices`
        },
        {
          role: "user",
          content: JSON.stringify(elements.map((e: DOMElement, i: number) => ({ 
            index: i,
            description: e.description,
            elementType: e.elementType,
            role: e.role
          })))
        }
      ],
      max_tokens: 150,
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    console.log('Filter response:', content);

    if (!content) {
      console.warn('Empty response from filter');
      return elements.slice(0, 20);
    }

    try {
      const parsed = JSON.parse(content);
      if (!parsed || !Array.isArray(parsed.indices)) {
        console.warn('Invalid response format:', content);
        return elements.slice(0, 20);
      }

      // Ensure indices are valid numbers and within bounds
      const validIndices = parsed.indices
        .filter((i: unknown): i is number => 
          typeof i === 'number' && 
          Number.isInteger(i) && 
          i >= 0 && 
          i < elements.length
        );

      if (validIndices.length === 0) {
        console.warn('No valid indices found');
        return elements.slice(0, 20);
      }

      return validIndices.map(i => elements[i]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      return elements.slice(0, 20);
    }
  } catch (error) {
    console.error('Filter error:', error);
    return elements.slice(0, 20);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')!,
    })

    const { elements } = await req.json() as RequestBody
    const lastActionCategory = req.headers.get('X-Last-Action-Category');

    // Check cache first
    const cacheKey = generateCacheKey(elements, lastActionCategory);
    const cachedResult = cache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      console.log('Cache hit!');
      return new Response(
        JSON.stringify({ actions: cachedResult.data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Preprocess elements to reduce token usage
    const processedElements = preprocessElements(elements);

    // Pre-filter important elements if we have too many
    const importantElements = processedElements.length > 30 
      ? await filterImportantElements(openai, processedElements)
      : processedElements;

    // Use streaming for faster initial response
    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Analyze DOM elements and suggest ALL relevant interactive elements. Return a JSON array of actions:
[{"id": "path", "description": "clear action", "x": number, "y": number, "elementType": "type", "confidence": 0.1-1.0, "category": "navigation|content|action"}]
Rules: Return ALL possible actions (up to 20), include descriptions (max 100 chars), use exact paths and coordinates. Include confidence scores from 0.1 to 1.0 to show relative importance.`
        },
        {
          role: "user",
          content: JSON.stringify({
            elements: importantElements,
            context: { lastActionCategory }
          })
        }
      ],
      max_tokens: 2000,
      temperature: 0,
      stream: true
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk.choices[0]?.delta?.content || '';
    }
    
    let actions: AgentAction[];
    try {
      const parsed = JSON.parse(fullResponse || '[]');
      actions = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing GPT response:', error, 'Raw response:', fullResponse);
      actions = [];
    }

    // Return all actions without filtering by confidence
    actions = actions
      .sort((a, b) => b.confidence - a.confidence)
      .map(action => ({
        id: action.id,
        description: action.description,
        x: action.x,
        y: action.y,
        elementType: action.elementType,
        confidence: action.confidence,
        category: action.category
      }));

    // Cache the result
    cache.set(cacheKey, { data: actions, timestamp: Date.now() });

    return new Response(
      JSON.stringify({ actions }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        actions: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}) 
