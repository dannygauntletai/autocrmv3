import { Tool } from "@langchain/core/tools";
import { createClient } from "@supabase/supabase-js";
import { ToolResult } from "../types";

export class SearchTool extends Tool {
  name = "search";
  description = "Search through knowledge base and ticket history. Input should be a JSON string with 'type' ('rag', 'similarity', or 'keyword'), 'query', and optional 'filters'.";
  
  private supabase;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(
    supabaseUrl: string,
    supabaseKey: string
  ) {
    super();
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /** @ignore */
  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const result = await this.executeSearch(parsed);
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

  private async executeSearch(args: {
    type: 'rag' | 'similarity' | 'keyword',
    query: string,
    filters?: Record<string, any>
  }): Promise<ToolResult> {
    switch (args.type) {
      case 'rag':
        return await this.performRAGSearch(args.query, args.filters);
      case 'similarity':
        return await this.performSimilaritySearch(args.query, args.filters);
      case 'keyword':
        return await this.performKeywordSearch(args.query, args.filters);
      default:
        throw new Error(`Unknown search type: ${args.type}`);
    }
  }

  private async performRAGSearch(query: string, filters?: Record<string, any>): Promise<ToolResult> {
    // First, get relevant documents using similarity search
    const { data: documents, error: docError } = await this.supabase
      .rpc('match_documents', {
        query_embedding: await this.getEmbedding(query),
        match_threshold: 0.7,
        match_count: 5,
        ...filters
      });

    if (docError) throw docError;

    // Then, get relevant ticket history
    const { data: tickets, error: ticketError } = await this.supabase
      .from('tickets')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        messages(content, type, created_at)
      `)
      .textSearch('title || description', query)
      .limit(3);

    if (ticketError) throw ticketError;

    return {
      success: true,
      data: {
        documents,
        relatedTickets: tickets
      },
      context: {
        ticketId: 'global',  // Search tool operates globally
        userId: 'system',
        timestamp: Date.now(),
        metadata: {
          searchType: 'rag',
          documentsFound: documents.length,
          ticketsFound: tickets.length
        }
      }
    };
  }

  private async performSimilaritySearch(query: string, filters?: Record<string, any>): Promise<ToolResult> {
    const { data, error } = await this.supabase
      .rpc('match_documents', {
        query_embedding: await this.getEmbedding(query),
        match_threshold: 0.7,
        match_count: 10,
        ...filters
      });

    if (error) throw error;

    return {
      success: true,
      data,
      context: {
        ticketId: 'global',  // Search tool operates globally
        userId: 'system',
        timestamp: Date.now(),
        metadata: {
          searchType: 'similarity',
          documentsFound: data.length
        }
      }
    };
  }

  private async performKeywordSearch(query: string, filters?: Record<string, any>): Promise<ToolResult> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .textSearch('content', query)
      .limit(10);

    if (error) throw error;

    return {
      success: true,
      data,
      context: {
        ticketId: 'global',  // Search tool operates globally
        userId: 'system',
        timestamp: Date.now(),
        metadata: {
          searchType: 'keyword',
          documentsFound: data.length
        }
      }
    };
  }

  private async getEmbedding(text: string): Promise<number[]> {
    // Call the embedding generation edge function
    const response = await fetch(`${this.supabaseUrl}/functions/v1/create-embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Failed to generate embedding');
    }

    const { embedding } = await response.json();
    return embedding;
  }
} 
