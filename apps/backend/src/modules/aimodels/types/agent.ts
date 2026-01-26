/**
 * AI Agent Type
 *
 * Represents an AI “agent” that can respond to events, call tools, and execute workflows.
 */
export type AiAgent = {
  /**
   * Unique name of the agent
   */
  name: string;

  /**
   * Description of the agent’s role
   */
  description: string;

  /**
   * System prompt used as context for the agent
   */
  systemPrompt: string;

  /**
   * Tools the agent is allowed to call
   */
  allowedTools: string[];
};
