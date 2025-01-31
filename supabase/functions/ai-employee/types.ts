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

export type ModelType = 'gpt-4-turbo-preview' | 'gpt-3.5-turbo';

export interface ModelConfig {
  modelName: ModelType;
  temperature: number;
}

export const MODEL_CONFIGS: Record<'simple' | 'complex', ModelConfig> = {
  simple: {
    modelName: 'gpt-3.5-turbo',
    temperature: 0.3
  },
  complex: {
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7
  }
} as const; 
