import { query, type AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import {
  ReviewReport,
  ReviewReportJSONSchema,
  ReviewReportSchema
} from './types/report-types';
import { mcpServersConfig } from './config/mcp.config';
import {
  codeQualityAnalyzer,
  testCoverageAnalyzer,
  refactoringSuggester
} from './agents';
import { buildOrchestratorPrompt } from './prompts';
import {
  RateLimiter,
  DEFAULT_RATE_LIMITS,
  type RateLimiterConfig
} from './utils/rate-limiter';
import {
  ReviewError,
  ErrorCodes,
  withRetry,
  withTimeout
} from './utils/error-handler';

type StructuredResultMessage = {
  type: 'result';
  subtype: string;
  structured_output?: unknown;
  result?: string;
};

export interface OrchestratorOptions {
  rateLimit?: Partial<RateLimiterConfig>;
  maxTurns?: number;
  timeoutMs?: number;
}

export class CodeReviewOrchestrator {
  private readonly rateLimiter: RateLimiter;
  private readonly maxTurns: number;
  private readonly timeoutMs: number;

  constructor(options: OrchestratorOptions = {}) {
    this.rateLimiter = new RateLimiter({
      ...DEFAULT_RATE_LIMITS,
      ...(options.rateLimit ?? {})
    });

    this.maxTurns = options.maxTurns ?? 40;
    this.timeoutMs = options.timeoutMs ?? 300000;
  }

  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    const startTime = Date.now();

    if (
      !owner ||
      !repo ||
      !Number.isInteger(prNumber) ||
      prNumber <= 0
    ) {
      throw new ReviewError(
        'Invalid pull request information',
        ErrorCodes.INVALID_CONFIG,
        {
          owner,
          repo,
          prNumber
        }
      );
    }

    const agents: Record<string, AgentDefinition> = {
      codeQualityAnalyzer: {
        ...codeQualityAnalyzer,
        tools: [
          'mcp__github__pull_request_read',
          'Skill'
        ]
      },

      testCoverageAnalyzer: {
        ...testCoverageAnalyzer,
        tools: [
          'mcp__github__pull_request_read'
        ]
      },

      refactoringSuggester: {
        ...refactoringSuggester,
        tools: [
          'mcp__github__pull_request_read'
        ]
      }
    };

    await this.rateLimiter.acquire(10000);

    try {
      const report = await withRetry(
        () =>
          withTimeout(
            async (): Promise<ReviewReport> => {
              const response = query({
                prompt: buildOrchestratorPrompt(
                  owner,
                  repo,
                  prNumber
                ),

                options: {
                  model: process.env.ANTHROPIC_MODEL,
                  maxTurns: this.maxTurns,

                  allowedTools: [
                    'Task',
                    'mcp__github__pull_request_read'
                  ],

                  mcpServers: mcpServersConfig,

                  agents,

                  outputFormat: {
                    type: 'json_schema',
                    schema: ReviewReportJSONSchema
                  },

                  settingSources: ['project']
                }
              });

              let finalReport: ReviewReport | undefined;

              for await (const message of response) {
                if (message.type !== 'result') {
                  continue;
                }

                const resultMessage =
                  message as unknown as StructuredResultMessage;

                if (
                  resultMessage.subtype === 'success' &&
                  resultMessage.structured_output !== undefined
                ) {
                  const parsed =
                    ReviewReportSchema.safeParse(
                      resultMessage.structured_output
                    );

                  if (!parsed.success) {
                    throw new ReviewError(
                      'Structured review output failed validation',
                      ErrorCodes.VALIDATION_FAILED,
                      {
                        issues: parsed.error.issues
                      }
                    );
                  }

                  finalReport = parsed.data;
                }
              }

              if (!finalReport) {
                throw new ReviewError(
                  'No structured review report was returned',
                  ErrorCodes.STRUCTURED_OUTPUT_FAILED
                );
              }

              if (finalReport.fileReviews.length === 0) {
                throw new ReviewError(
                  'The orchestrator returned an empty review report. No pull-request files were analyzed.',
                  ErrorCodes.STRUCTURED_OUTPUT_FAILED,
                  {
                    owner,
                    repo,
                    prNumber
                  }
                );
              }

              if (
                finalReport.pullRequest.owner !== owner ||
                finalReport.pullRequest.repo !== repo ||
                finalReport.pullRequest.number !== prNumber
              ) {
                throw new ReviewError(
                  'Structured report contains incorrect pull-request information',
                  ErrorCodes.VALIDATION_FAILED,
                  {
                    expected: {
                      owner,
                      repo,
                      number: prNumber
                    },
                    actual: finalReport.pullRequest
                  }
                );
              }

              if (
                finalReport.summary.totalFiles !==
                finalReport.fileReviews.length
              ) {
                throw new ReviewError(
                  'Review report file count does not match file reviews',
                  ErrorCodes.VALIDATION_FAILED,
                  {
                    totalFiles: finalReport.summary.totalFiles,
                    fileReviews:
                      finalReport.fileReviews.length
                  }
                );
              }

              return finalReport;
            },
            this.timeoutMs,
            `Code review timed out after ${this.timeoutMs}ms`
          ),
        3,
        1000
      );

      return {
        ...report,
        metadata: {
          ...report.metadata,
          duration: Date.now() - startTime
        }
      };
    } catch (error) {
      if (error instanceof ReviewError) {
        throw error;
      }

      throw new ReviewError(
        error instanceof Error
          ? error.message
          : String(error),
        ErrorCodes.AGENT_FAILED,
        {
          owner,
          repo,
          prNumber
        }
      );
    } finally {
      this.rateLimiter.release();
    }
  }
}