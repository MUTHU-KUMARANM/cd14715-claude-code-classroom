import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts';

export const codeQualityAnalyzer: AgentDefinition = {
  description:
    'Analyzes source code for security issues, performance problems, maintainability concerns, bugs, style issues, and best-practice violations.',

  prompt: CODE_QUALITY_ANALYZER_PROMPT,

  tools: [
    'mcp__github__pull_request_read',
    'Skill'
  ],

  model: 'inherit',
};