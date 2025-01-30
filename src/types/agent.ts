/**
 * Initial type definitions for the AutoCRM AI Employee Agent system.
 * 
 * IMPORTANT: These types are not final and will evolve as we implement the edge functions.
 * They serve as a foundation for our agent system and will be modified to:
 * - Accommodate specific edge function requirements
 * - Integrate with Supabase and other backend services
 * - Support different agent roles and capabilities
 * - Enhance type safety as we implement specific features
 * 
 * @version 0.1.0
 * @package AutoCRM
 */

import { BaseMessage } from "@langchain/core/messages";

// Agent Action Types
export interface AIEmployeeAction {
  type: 'query' | 'update' | 'create' | 'delete' | 'respond' | 'escalate';
  tool: string;
  input: Record<string, any>;
  thought?: string;
}

// Agent State Interface
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

// Agent Configuration
export interface AIEmployeeConfig {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// SQL Toolkit Options
export interface SQLToolkitOptions {
  database: any;  // We'll type this more specifically when we implement the actual database integration
  includesTables?: string[];
  maxRows?: number;
  customQueries?: Record<string, string>;
  allowedOperations: ('select' | 'update' | 'insert' | 'delete')[];
}

// Memory Types
export interface AgentMemoryTypes {
  conversationBuffer: BaseMessage[];
  vectorStore: {
    namespace: string;
    metadata: Record<string, any>;
  };
  keyValueStore: Map<string, any>;
}

// Agent Response Type
export interface AIEmployeeResponse {
  action: AIEmployeeAction;
  response?: string;
  metadata: {
    confidence: number;
    reasoning: string;
    timestamp: number;
  };
} 
