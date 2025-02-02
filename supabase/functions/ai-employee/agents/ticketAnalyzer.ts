import { Tool } from "langchain/tools";
import { AgentStep } from "langchain/schema";
import { 
  BaseToolConfig, 
  TicketAnalyzerConfig,
  AnalyzerResult,
  ToolResult
} from "../types.ts";
import { 
  ReadTicketTool, 
  UpdateTicketStatusTool, 
  UpdateTicketPriorityTool,
  AssignTicketTool,
  AddInternalNoteTool,
  AddToKnowledgebaseTool
} from "../tools/ticket/index.ts";
import { SmartAssignTicketTool } from "../tools/ticket/smartAssign.ts";
import { SearchTool } from "../tools/search.ts";
import { MessageTool } from "../tools/message.ts";
import { createClient } from "@supabase/supabase-js";
import { FunctionsAgent } from "./functionsAgent.ts";

export class TicketAnalyzer {
  private config: TicketAnalyzerConfig;
  private tools: Tool[];
  private supabase;
  private readTicketTool: ReadTicketTool;
  private cachedTicketData?: ToolResult;
  private availableTeams: string[] = [];

  constructor(config: TicketAnalyzerConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    
    // Initialize tools with proper typing
    this.readTicketTool = new ReadTicketTool(config);
    this.tools = [
      this.readTicketTool,
      new UpdateTicketStatusTool(config),
      new UpdateTicketPriorityTool(config),
      new AssignTicketTool(config),
      new AddInternalNoteTool(config),
      new AddToKnowledgebaseTool(config),
      new SmartAssignTicketTool(config),
      new SearchTool(config.supabaseUrl, config.supabaseKey),
      new MessageTool(config.ticketId, config.supabaseUrl, config.supabaseKey, config.aiEmployeeId)
    ];
  }

  private async loadAvailableTeams(): Promise<void> {
    const { data: teams, error } = await this.supabase
      .from('teams')
      .select('name')
      .order('name');

    if (error) {
      console.error("[TicketAnalyzer] Error loading teams:", error);
      return;
    }

    this.availableTeams = teams?.map(t => t.name) || [];
  }

  async analyzeWithTools(tools: Tool[], functionsAgent: FunctionsAgent): Promise<AnalyzerResult> {
    try {
      // Load available teams first
      await this.loadAvailableTeams();
      
      // Step 1: Gather ticket data for analysis
      const ticketData = await this.readTicket();
      
      if (!ticketData.success || !ticketData.data?.ticket) {
        throw new Error(`Failed to read ticket data for analysis. Ticket ID: ${this.config.ticketId}`);
      }

      // Step 2: Use the functions agent to analyze and execute actions
      const analysisTask = `
        Analyze this ticket and determine what actions need to be taken. You have access to the following tools:

        1. update_ticket_status: Update ticket status (open, pending, resolved)
           - Use when ticket state needs to change based on content or actions taken
           - Consider the current status and whether it accurately reflects the ticket state
           - 'open': Active ticket requiring attention
           - 'pending': Waiting for customer response or external action
           - 'resolved': Issue has been addressed and solution provided

        2. update_ticket_priority: Set ticket priority (low, medium, high)
           - Use when priority needs adjustment based on:
             * Customer impact and urgency (high)
             * Business criticality (medium to high)
             * Time sensitivity (medium)
             * Resource requirements (low to medium)
           - IMPORTANT: Only these priorities are allowed: low, medium, high
           - For urgent matters, use high priority and communicate urgency in notes
           - Never attempt to set priority to 'urgent' or other values

        3. assign_ticket: Assign to specific employee by email/ID
           - Use when direct assignment to a specific employee is needed
           - Only use this when you have a specific reason to assign to a particular person
           - Consider employee expertise and current workload
           - Prefer smart_assign_ticket over this for most cases

        4. assign_team: Assign to a team
           - Use when team-level assignment is more appropriate
           - Consider team expertise and ticket nature
           - Available teams: ${this.availableTeams.join(', ')}
           - Match team expertise with ticket requirements
           - Only use teams from the available list

        5. smart_assign_ticket: Intelligently assign based on skills and workload
           - This should be your default choice for employee assignments
           - Automatically considers:
             * Required skills for the ticket
             * Current workload of employees
             * Past performance with similar issues
             * Team expertise alignment
             * Average resolution time
             * Employee role suitability
           - Input can be specific skills needed or general context
           - Examples:
             * "javascript debugging" for technical issues
             * "customer communication" for support issues
             * "billing expertise" for payment issues
           - Will automatically find the best available employee

        6. add_internal_note: Add private note visible only to employees
           - Use to document your reasoning
           - Record important context or decisions
           - Highlight specific aspects for the team
           - Document any customer communication strategy

        7. send_message: Send a message to the customer
           - Use to keep the customer informed
           - Acknowledge receipt of their request
           - Ask for clarification when needed
           - Provide updates on progress
           - Explain solutions or next steps
           - Always maintain a professional and helpful tone

        8. add_to_knowledgebase: Add ticket to knowledge base
           - Use when a ticket is being resolved and contains valuable information
           - Particularly important for:
             * Common issues with clear solutions
             * Complex problems with documented resolutions
             * Unique situations that might recur
             * Best practices or workflow improvements

        9. search: Search for relevant information
           - Use to find similar past tickets
           - Search knowledge base for solutions
           - Look up relevant documentation
           - Find related customer history
           - Types: 'rag' (semantic), 'similarity', 'keyword'

        For each tool, carefully consider:
        1. Whether it's needed based on ticket content and current state
        2. The appropriate order of operations
        3. The impact of each action
        4. Required follow-up actions

        Important Workflows:
        - When marking a ticket as 'resolved':
          1. Consider adding to knowledge base if solution is reusable
          2. Send a closing message to the customer
          3. Document the resolution in internal notes

        - When changing status to 'pending':
          1. Clearly communicate what we're waiting for
          2. Set appropriate follow-up reminders
          3. Document the pending reason internally

        - When assigning tickets:
          1. Use smart_assign_ticket for best match
          2. Document assignment reasoning
          3. Brief the assigned person/team
          4. Update the customer if appropriate

        Current Ticket Data:
        ${JSON.stringify(ticketData.data.ticket, null, 2)}

        Analyze the ticket and execute the necessary actions. For each action, explain your reasoning.
      `;

      // Use the functions agent to both analyze and execute actions
      const result = await functionsAgent.processInput(analysisTask);

      // Log the completion of analysis
      await this.addMessage(`Analysis completed for ticket ${this.config.ticketId}`, true);

      return {
        success: true,
        output: result.output,
        steps: result.steps,
        toolCalls: result.toolCalls?.map(call => ({
          tool: call.tool,
          input: call.input,
          output: call.output
        })),
        context: {
          ticketId: this.config.ticketId,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      console.error("[TicketAnalyzer] Error during analysis:", error);
      
      // Log the error internally
      await this.addMessage(`Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`, true);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
        context: {
          ticketId: this.config.ticketId,
          timestamp: Date.now()
        }
      };
    }
  }

  private async readTicket(): Promise<ToolResult> {
    try {
      // Return cached data if available
      if (this.cachedTicketData) {
        return this.cachedTicketData;
      }

      // Parse the result only once and cache it
      const result = await this.readTicketTool._call('');
      const parsedResult = JSON.parse(result) as ToolResult;
      this.cachedTicketData = parsedResult;
      return parsedResult;
    } catch (error) {
      console.error("[TicketAnalyzer] Error reading ticket:", error);
      throw new Error(`Failed to read ticket: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async addMessage(message: string, isInternal: boolean): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ticket_messages')
        .insert({
          ticket_id: this.config.ticketId,
          message_body: message,
          is_internal: isInternal,
          sender_type: 'system',
          sender_id: this.config.aiEmployeeId
        });

      if (error) throw error;
    } catch (error) {
      console.error("[TicketAnalyzer] Error adding message:", error);
      throw error;
    }
  }
} 
