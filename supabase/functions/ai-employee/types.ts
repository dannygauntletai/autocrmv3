import { BaseMessage } from 'langchain/schema';
import { Tool } from 'langchain/tools';

export interface TicketTool extends Tool {
  ticketId: string;
  action: 'read' | 'update' | 'comment';
}

export interface MemoryTool extends Tool {
  type: 'short_term' | 'working' | 'long_term';
  operation: 'read' | 'write' | 'clear';
}

export interface SearchTool extends Tool {
  type: 'rag' | 'similarity' | 'keyword';
  namespace: string;
}

export interface MessageTool extends Tool {
  type: 'customer' | 'internal';
  action: 'send' | 'generate' | 'analyze';
}

export interface ToolContext {
  ticketId: string;
  userId: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  context?: ToolContext;
}

export interface AIEmployeeConfig {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIEmployeeState {
  currentTicket: string | null;
  conversationHistory: BaseMessage[];
  lastAction: string | null;
  context: Record<string, any>;
  memory: {
    shortTerm: BaseMessage[];
    workingMemory: Record<string, any>;
  };
} 
