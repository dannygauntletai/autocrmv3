import { Tool } from 'langchain/tools';
import { createClient } from '@supabase/supabase-js';
import { ToolResult } from '../types.ts';
import { BaseMessage, HumanMessage } from 'langchain/schema';

export class MemoryManagementTool extends Tool {
  name = "memory_management";
  description = `Manage conversation memory including short-term and working memory.
Use 'read short_term' to read short-term memory.
Use 'read working' to read working memory.
Use 'write short_term MESSAGE' to add to short-term memory.
Use 'write working KEY=VALUE' to add to working memory.
Use 'clear short_term/working' to clear memory.`;
  
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
      const [operation, memoryType, ...dataParts] = input.trim().split(' ');
      const data = dataParts.join(' ');

      if (!['read', 'write', 'clear'].includes(operation)) {
        throw new Error("Operation must be 'read', 'write', or 'clear'");
      }

      if (memoryType !== 'short_term' && memoryType !== 'working') {
        throw new Error("Type must be 'short_term' or 'working'");
      }

      const type = memoryType as 'short_term' | 'working';
      let result: ToolResult;

      switch (operation) {
        case 'read':
          result = await this.readMemory(type);
          break;
        case 'write':
          if (!data) throw new Error("Data is required for write operation");
          if (type === 'working') {
            // Parse KEY=VALUE format for working memory
            const [key, value] = data.split('=');
            if (!key || !value) throw new Error("Working memory writes must be in KEY=VALUE format");
            result = await this.writeMemory(type, { [key.trim()]: value.trim() });
          } else {
            result = await this.writeMemory(type, [new HumanMessage(data)]);
          }
          break;
        case 'clear':
          result = await this.clearMemory(type);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return JSON.stringify(result, (_, value) => {
        if (value === undefined) return null;
        if (value instanceof Error) return value.message;
        return value;
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred"
      }, (_, value) => {
        if (value === undefined) return null;
        if (value instanceof Error) return value.message;
        return value;
      });
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
