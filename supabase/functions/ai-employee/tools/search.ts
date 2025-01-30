import { Tool } from "@langchain/core/tools";
import { createClient } from "@supabase/supabase-js";
import { ToolResult } from "../types";
import type { Database } from "../../../../types/database.types";

type KBArticle = Database['public']['Tables']['kb_articles']['Row'];
type TicketMessage = Database['public']['Tables']['ticket_messages']['Row'];

export class SearchTool extends Tool {
  name = "search";
  description = "Search through knowledge base articles, ticket history, and file embeddings. Input should be a JSON string with 'type' ('rag', 'similarity', or 'keyword'), 'query', and optional 'filters' like category or date range.";
  
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
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
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
    filters?: {
      category?: string;
      dateRange?: { start: string; end: string };
      tags?: string[];
    }
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

  private async performRAGSearch(
    query: string, 
    filters?: {
      category?: string;
      dateRange?: { start: string; end: string };
      tags?: string[];
    }
  ): Promise<ToolResult> {
    const queryEmbedding = await this.getEmbedding(query);

    const { data: articles, error: articleError } = await this.supabase
      .rpc('search_kb_articles', {
        search_query: query
      });

    if (articleError) throw articleError;

    const { data: messages, error: messageError } = await this.supabase
      .from('ticket_messages')
      .select(`
        id,
        message_body,
        created_at,
        updated_at,
        is_internal,
        sender_id,
        sender_type,
        ticket_id,
        tickets (
          title,
          status,
          priority,
          category
        )
      `)
      .textSearch('message_body', query)
      .eq('is_internal', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (messageError) throw messageError;

    let filteredArticles = articles as KBArticle[];
    if (filters) {
      if (filters.category) {
        filteredArticles = filteredArticles.filter((article: KBArticle) => 
          article.category_id === filters.category
        );
      }
      if (filters.tags) {
        filteredArticles = filteredArticles.filter((article: KBArticle) => 
          article.tags?.some((tag: string) => filters.tags?.includes(tag))
        );
      }
      if (filters.dateRange) {
        filteredArticles = filteredArticles.filter((article: KBArticle) => 
          article.created_at >= filters.dateRange!.start && 
          article.created_at <= filters.dateRange!.end
        );
      }
    }

    const { data: fileEmbeddings, error: fileError } = await (this.supabase as any)
      .from('file_embeddings')
      .select('*')
      .limit(3);

    if (fileError) throw fileError;

    const typedMessages = messages as unknown as TicketMessage[];

    return {
      success: true,
      data: {
        knowledgeBase: filteredArticles,
        relevantMessages: typedMessages,
        relatedFiles: fileEmbeddings
      },
      context: {
        ticketId: 'global',
        userId: 'system',
        timestamp: Date.now(),
        metadata: {
          searchType: 'rag',
          articlesFound: filteredArticles.length,
          messagesFound: messages?.length ?? 0,
          filesFound: fileEmbeddings?.length ?? 0,
          filters: filters ?? 'none'
        }
      }
    };
  }

  private async performSimilaritySearch(
    query: string, 
    filters?: {
      category?: string;
      dateRange?: { start: string; end: string };
      tags?: string[];
    }
  ): Promise<ToolResult> {
    const queryEmbedding = await this.getEmbedding(query);

    const { data: articles, error: articleError } = await this.supabase
      .rpc('search_kb_articles', {
        search_query: query
      });

    if (articleError) throw articleError;

    let filteredArticles = articles as KBArticle[];
    if (filters) {
      if (filters.category) {
        filteredArticles = filteredArticles.filter((article: KBArticle) => 
          article.category_id === filters.category
        );
      }
      if (filters.tags) {
        filteredArticles = filteredArticles.filter((article: KBArticle) => 
          article.tags?.some((tag: string) => filters.tags?.includes(tag))
        );
      }
    }

    return {
      success: true,
      data: filteredArticles,
      context: {
        ticketId: 'global',
        userId: 'system',
        timestamp: Date.now(),
        metadata: {
          searchType: 'similarity',
          documentsFound: filteredArticles.length,
          filters: filters ?? 'none'
        }
      }
    };
  }

  private async performKeywordSearch(
    query: string, 
    filters?: {
      category?: string;
      dateRange?: { start: string; end: string };
      tags?: string[];
    }
  ): Promise<ToolResult> {
    const { data: articles, error: articleError } = await this.supabase
      .from('kb_articles')
      .select(`
        *,
        category:category_id (
          name
        )
      `)
      .textSearch('title || content', query)
      .limit(10);

    if (articleError) throw articleError;

    let filteredArticles = articles as KBArticle[];
    if (filters) {
      if (filters.category) {
        filteredArticles = filteredArticles.filter((article: KBArticle) => 
          article.category_id === filters.category
        );
      }
      if (filters.tags) {
        filteredArticles = filteredArticles.filter((article: KBArticle) => 
          article.tags?.some((tag: string) => filters.tags?.includes(tag))
        );
      }
      if (filters.dateRange) {
        filteredArticles = filteredArticles.filter((article: KBArticle) => 
          article.created_at >= filters.dateRange!.start && 
          article.created_at <= filters.dateRange!.end
        );
      }
    }

    return {
      success: true,
      data: filteredArticles,
      context: {
        ticketId: 'global',
        userId: 'system',
        timestamp: Date.now(),
        metadata: {
          searchType: 'keyword',
          documentsFound: filteredArticles.length,
          filters: filters ?? 'none'
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
