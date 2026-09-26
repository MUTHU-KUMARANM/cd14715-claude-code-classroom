import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts';

export const refactoringSuggester: AgentDefinition = {
  description:
    'Identifies refactoring opportunities and recommends improvements to code structure, readability, and maintainability.',

  prompt: REFACTORING_SUGGESTER_PROMPT,

  tools: ['mcp__github__pull_request_read', 'Skill'],

  model: 'inherit',
};