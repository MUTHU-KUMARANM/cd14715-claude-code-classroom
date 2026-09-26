import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts';

export const testCoverageAnalyzer: AgentDefinition = {
  description:
    'Analyzes test coverage and identifies untested functions, classes, branches, and edge cases.',

  prompt: TEST_COVERAGE_ANALYZER_PROMPT,

  tools: ['mcp__github__pull_request_read', 'Skill'],

  model: 'inherit',
};