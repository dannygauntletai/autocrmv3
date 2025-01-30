import { Tool } from 'langchain/tools';
import { createClient } from '@supabase/supabase-js';
import { ToolResult } from '../types.ts';

export class MessageTool extends Tool {
  name = "message";
  description = `Handle message operations including sending responses and analyzing messages.
For sending messages, use 'send customer/internal YOUR MESSAGE'.
For generating responses, use 'generate customer/internal CONTEXT'.
For analyzing messages, use 'analyze MESSAGE'.`;
  
  private ticketId: string;
  private supabase;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(
    ticketId: string,
    supabaseUrl: string,
    supabaseKey: string
  ) {
    super();
    this.ticketId = ticketId;
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /** @ignore */
  async _call(input: string): Promise<string> {
    try {
      const [action, messageType, ...contentParts] = input.trim().split(' ');
      const content = contentParts.join(' ');

      if (action === 'send' || action === 'generate') {
        if (messageType !== 'customer' && messageType !== 'internal') {
          throw new Error("Type must be 'customer' or 'internal'");
        }
        
        if (action === 'send') {
          return JSON.stringify(await this.sendMessage(messageType as 'customer' | 'internal', content));
        } else {
          return JSON.stringify(await this.generateResponse(messageType as 'customer' | 'internal', content));
        }
      }

      if (action === 'analyze') {
        return JSON.stringify(await this.analyzeMessage(content));
      }

      throw new Error(`Unknown action: ${action}. Use 'send', 'generate', or 'analyze'.`);
    } catch (error) {
      if (error instanceof Error) {
        return JSON.stringify({
          success: false,
          error: error.message
        });
      }
      return JSON.stringify({
        success: false,
        error: "An unknown error occurred"
      });
    }
  }

  private async sendMessage(type: 'customer' | 'internal', content: string): Promise<ToolResult> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        ticket_id: this.ticketId,
        content,
        type,
        sender: 'ai_employee'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      context: {
        ticketId: this.ticketId,
        userId: 'ai_employee',
        timestamp: Date.now(),
        metadata: {
          messageType: type,
          messageId: data.id
        }
      }
    };
  }

  private async generateResponse(type: 'customer' | 'internal', context: string): Promise<ToolResult> {
    // Call the response generation edge function
    const response = await fetch(`${this.supabaseUrl}/functions/v1/generate-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({
        ticketId: this.ticketId,
        type,
        context
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate response');
    }

    const result = await response.json();

    return {
      success: true,
      data: result,
      context: {
        ticketId: this.ticketId,
        userId: 'ai_employee',
        timestamp: Date.now(),
        metadata: {
          responseType: type,
          generationContext: context.substring(0, 100) + '...'
        }
      }
    };
  }

  private async analyzeMessage(content: string): Promise<ToolResult> {
    // Analyze message sentiment, intent, and key information
    const analysis = {
      sentiment: await this.analyzeSentiment(content),
      intent: await this.detectIntent(content),
      entities: await this.extractEntities(content)
    };

    return {
      success: true,
      data: analysis,
      context: {
        ticketId: this.ticketId,
        userId: 'ai_employee',
        timestamp: Date.now(),
        metadata: {
          analysisType: 'full',
          contentLength: content.length
        }
      }
    };
  }

  private async analyzeSentiment(text: string): Promise<string> {
    // Call OpenAI for sentiment analysis
    const response = await fetch(`${this.supabaseUrl}/functions/v1/analyze-sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze sentiment');
    }

    const { sentiment } = await response.json();
    return sentiment;
  }

  private async detectIntent(text: string): Promise<string> {
    // Call OpenAI for intent detection
    const response = await fetch(`${this.supabaseUrl}/functions/v1/detect-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Failed to detect intent');
    }

    const { intent } = await response.json();
    return intent;
  }

  private async extractEntities(text: string): Promise<Record<string, any>> {
    // Call OpenAI for entity extraction
    const response = await fetch(`${this.supabaseUrl}/functions/v1/extract-entities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Failed to extract entities');
    }

    const { entities } = await response.json();
    return entities;
  }
} 
