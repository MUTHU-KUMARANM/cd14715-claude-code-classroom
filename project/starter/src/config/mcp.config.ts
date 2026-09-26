import type { McpServerConfig } from '@anthropic-ai/claude-agent-sdk';

export function createMcpServersConfig(githubToken: string): Record<string, McpServerConfig> {
  if (!githubToken) throw new Error('GITHUB_TOKEN is required for the GitHub MCP server.');
  return {
    github: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'], env: { GITHUB_PERSONAL_ACCESS_TOKEN: githubToken } },
    eslint: { type: 'stdio', command: 'npx', args: ['-y', '@eslint/mcp@latest'], env: {} }
  };
}
