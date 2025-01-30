import { Tool } from "@langchain/core/tools";
import { createClient } from "@supabase/supabase-js";
import { ToolResult } from "../types";

export class MessageTool extends Tool {
  name = "message";
  description = "Handle message operations including sending responses and analyzing messages. Input should be a JSON string with 'action' ('send', 'generate', or 'analyze'), 'type' ('customer' or 'internal'), and 'content'.";
  
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
      const parsed = JSON.parse(input);
      const result = await this.executeAction(parsed);
      return JSON.stringify(result);
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

  private async executeAction(args: {
    action: 'send' | 'generate' | 'analyze',
    type: 'customer' | 'internal',
    content: string
  }): Promise<ToolResult> {
    switch (args.action) {
      case 'send':
        return await this.sendMessage(args.type, args.content);
      case 'generate':
        return await this.generateResponse(args.type, args.content);
      case 'analyze':
        return await this.analyzeMessage(args.content);
      default:
        throw new Error(`Unknown action: ${args.action}`);
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
