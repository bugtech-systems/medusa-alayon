/**
 * AI Tool Type
 *
 * Represents a callable tool or action in the AI module.
 */
export type AiTool = {
  /**
   * Unique tool name
   */
  name: string;

  /**
   * Description of what the tool does
   */
  description: string;

  /**
   * Function to execute the tool.
   * `args` contains parameters, `container` provides access to Medusa services.
   */
  execute: (args: Record<string, any>, container: any) => Promise<any>;
};
