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
  private employeeId: string;
  private supabase;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(
    ticketId: string,
    supabaseUrl: string,
    supabaseKey: string,
    employeeId: string
  ) {
    super();
    this.ticketId = ticketId;
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.employeeId = employeeId;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /** @ignore */
  async _call(input: string): Promise<string> {
    try {
      // Handle case where input is passed as an object
      let actualInput = input;
      try {
        const parsed = JSON.parse(input);
        if (parsed.input) {
          actualInput = parsed.input;
        }
      } catch {
        // Input is already a string, use as is
      }

      const [action, messageType, ...contentParts] = actualInput.trim().split(' ');
      const content = contentParts.join(' ');

      console.log("[MessageTool] Processing:", { action, messageType, contentLength: content?.length });

      if (action === 'send' || action === 'generate') {
        if (messageType !== 'customer' && messageType !== 'internal') {
          throw new Error("Type must be 'customer' or 'internal'");
        }
        
        if (action === 'send') {
          console.log("[MessageTool] Sending message:", { type: messageType, contentLength: content?.length });
          const result = await this.sendMessage(messageType as 'customer' | 'internal', content);
          console.log("[MessageTool] Send result:", result);
          return JSON.stringify(result);
        } else {
          console.log("[MessageTool] Generating response:", { type: messageType, context: content });
          const result = await this.generateResponse(messageType as 'customer' | 'internal', content);
          console.log("[MessageTool] Generate result:", result);
          return JSON.stringify(result);
        }
      }

      if (action === 'analyze') {
        return JSON.stringify(await this.analyzeMessage(content));
      }

      throw new Error(`Unknown action: ${action}. Use 'send', 'generate', or 'analyze'.`);
    } catch (error) {
      console.error("[MessageTool] Error:", error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
        context: {
          ticketId: this.ticketId,
          timestamp: Date.now(),
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : 'Unknown error'
        }
      });
    }
  }

  private async sendMessage(type: 'customer' | 'internal', content: string): Promise<ToolResult> {
    try {
      console.log("[MessageTool] Preparing to send message:", { type, contentLength: content?.length });

      if (!content || content.trim().length === 0) {
        throw new Error("Message content cannot be empty");
      }

      // Add the message to ticket_messages
      const { data: message, error: messageError } = await this.supabase
        .from('ticket_messages')
        .insert({
          ticket_id: this.ticketId,
          message_body: content.trim(),
          sender_type: 'employee',
          sender_id: this.employeeId,
          is_internal: type === 'internal',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (messageError) {
        console.error("[MessageTool] Error inserting message:", messageError);
        throw messageError;
      }

      console.log("[MessageTool] Message inserted:", message);

      // Add to ticket history
      const { error: historyError } = await this.supabase
        .from('ticket_history')
        .insert({
          ticket_id: this.ticketId,
          changed_by: this.employeeId,
          changes: {
            type: type === 'internal' ? 'internal_note' : 'customer_message',
            message: {
              id: message.id,
              content: content.trim()
            }
          },
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error("[MessageTool] Error inserting history:", historyError);
        throw historyError;
      }

      console.log("[MessageTool] History added successfully");

      return {
        success: true,
        data: message,
        context: {
          ticketId: this.ticketId,
          userId: 'ai_employee',
          timestamp: Date.now(),
          metadata: {
            messageType: type,
            messageId: message.id
          }
        }
      };
    } catch (error) {
      console.error("[MessageTool] Error in sendMessage:", error);
      throw error; // Let the _call method handle the error formatting
    }
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
