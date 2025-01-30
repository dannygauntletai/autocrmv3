import { Tool } from "@langchain/core/tools";
import { createClient } from "@supabase/supabase-js";
import { ToolResult } from "../types";
import { BaseMessage } from "@langchain/core/messages";

export class MemoryManagementTool extends Tool {
  name = "memory_management";
  description = "Manage conversation memory including short-term and working memory. Input should be a JSON string with 'operation' ('read', 'write', or 'clear'), 'type' ('short_term' or 'working'), and optional 'data'.";
  
  private ticketId: string;
  private supabase;
  private shortTermMemory: BaseMessage[] = [];
  private workingMemory: Record<string, any> = {};

  constructor(
    ticketId: string,
    supabaseUrl: string,
    supabaseKey: string
  ) {
    super();
    this.ticketId = ticketId;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /** @ignore */
  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const result = await this.executeOperation(parsed);
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

  private async executeOperation(args: { 
    operation: 'read' | 'write' | 'clear',
    type: 'short_term' | 'working',
    data?: any 
  }): Promise<ToolResult> {
    switch (args.operation) {
      case 'read':
        return await this.readMemory(args.type);
      case 'write':
        if (!args.data) throw new Error("Data is required for write operation");
        return await this.writeMemory(args.type, args.data);
      case 'clear':
        return await this.clearMemory(args.type);
      default:
        throw new Error(`Unknown operation: ${args.operation}`);
    }
  }

  private async readMemory(type: 'short_term' | 'working'): Promise<ToolResult> {
    const data = type === 'short_term' ? this.shortTermMemory : this.workingMemory;
    
    return {
      success: true,
      data,
      context: {
        ticketId: this.ticketId,
        userId: 'system',
        timestamp: Date.now(),
        metadata: {
          memoryType: type,
          operation: 'read'
        }
      }
    };
  }

  private async writeMemory(type: 'short_term' | 'working', data: any): Promise<ToolResult> {
    if (type === 'short_term') {
      if (!Array.isArray(data)) {
        throw new Error("Short-term memory data must be an array of messages");
      }
      this.shortTermMemory = [...this.shortTermMemory, ...data];
      // Keep only last N messages
      const maxMessages = 10;
      if (this.shortTermMemory.length > maxMessages) {
        this.shortTermMemory = this.shortTermMemory.slice(-maxMessages);
      }
    } else {
      this.workingMemory = { ...this.workingMemory, ...data };
    }

    return {
      success: true,
      data: type === 'short_term' ? this.shortTermMemory : this.workingMemory,
      context: {
        ticketId: this.ticketId,
        userId: 'system',
        timestamp: Date.now(),
        metadata: {
          memoryType: type,
          operation: 'write'
        }
      }
    };
  }

  private async clearMemory(type: 'short_term' | 'working'): Promise<ToolResult> {
    if (type === 'short_term') {
      this.shortTermMemory = [];
    } else {
      this.workingMemory = {};
    }

    return {
      success: true,
      data: null,
      context: {
        ticketId: this.ticketId,
        userId: 'system',
        timestamp: Date.now(),
        metadata: {
          memoryType: type,
          operation: 'clear'
        }
      }
    };
  }
} 