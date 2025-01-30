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
  lastAction: AIEmployeeAction | null;
  context: {
    customerInfo?: Record<string, any>;
    ticketInfo?: Record<string, any>;
    relevantDocs?: Array<{
      content: string;
      metadata: Record<string, any>;
    }>;
  };
  memory: {
    shortTerm: BaseMessage[];  // Recent messages/actions
    workingMemory: Record<string, any>;  // Current task-specific data
    longTerm?: {  // Optional long-term memory for patterns/preferences
      patterns: Record<string, any>;
      preferences: Record<string, any>;
    };
  };
}

// Agent Configuration
export interface AIEmployeeConfig {
  role: 'support' | 'sales' | 'technical' | 'admin';
  capabilities: string[];
  permissions: {
    canUpdateTickets: boolean;
    canEscalate: boolean;
    canAccessCustomerData: boolean;
    canModifyDatabase: boolean;
  };
  llmConfig: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  tools: string[];  // Available tools for this agent
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
