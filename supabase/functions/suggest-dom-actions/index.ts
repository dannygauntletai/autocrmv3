// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
}

async function filterImportantElements(openai: OpenAI, elements: DOMElement[]): Promise<DOMElement[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a DOM element analyzer that identifies the most important interactive elements on a page.
You must respond with ONLY a JSON object in this exact format: {"indices": [0, 1, 2, ...]}

Consider these factors when selecting elements:
1. Primary navigation elements
2. Main action buttons
3. Important form inputs
4. Key interactive elements

DO NOT include any explanatory text or other content in your response.`
      },
      {
        role: "user",
        content: JSON.stringify(elements)
      }
    ],
    max_tokens: 500,
    temperature: 0
  });

  try {
    const indices = JSON.parse(response.choices[0].message.content || '{"indices": []}').indices || [];
    return indices.map((index: number) => elements[index]).filter(Boolean);
  } catch (error) {
    console.error('Error parsing important elements:', error);
    // If parsing fails, return first 20 elements as fallback
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

    // Pre-filter important elements if we have too many
    const importantElements = elements.length > 30 
      ? await filterImportantElements(openai, elements)
      : elements;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that analyzes web application DOM elements to suggest the most relevant interactive elements for the user's current context. 

You must respond with ONLY a JSON array in this exact format:
[
  {
    "id": "exact-dom-path-from-input",
    "description": "clear action description",
    "x": number,
    "y": number,
    "elementType": "original-element-type",
    "confidence": number between 0.7 and 1.0
  }
]

Important rules:
1. Return ONLY the JSON array, no other text or content
2. Use the exact id/path from the input elements
3. Keep the original x,y coordinates
4. Keep the original element type
5. Make descriptions clear and concise
6. Assign confidence scores between 0.7 and 1.0
7. Focus on primary navigation and important actions
8. Include 3-5 actions in the array`
        },
        {
          role: "user",
          content: JSON.stringify(importantElements)
        }
      ],
      max_tokens: 1000,
      temperature: 0
    })

    const suggestedActions = response.choices[0].message.content
    console.log('GPT Response:', suggestedActions);
    
    let actions: AgentAction[];
    try {
      const parsed = JSON.parse(suggestedActions || '[]');
      actions = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing GPT response:', error, 'Raw response:', suggestedActions);
      actions = [];
    }

    // Filter out low confidence actions and ensure proper typing
    actions = actions
      .filter(action => action.confidence > 0.7)
      .map(action => ({
        id: action.id,
        description: action.description,
        x: action.x,
        y: action.y,
        elementType: action.elementType,
        confidence: action.confidence
      }));

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
