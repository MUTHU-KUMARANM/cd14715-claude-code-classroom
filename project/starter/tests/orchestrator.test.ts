import { describe, expect, it } from 'vitest';
import { CodeReviewOrchestrator } from '../src/orchestrator';
import { ReviewReportSchema } from '../src/types/report-types';
import { ReviewError, ErrorCodes, withRetry, withTimeout } from '../src/utils/error-handler';
import { RateLimiter } from '../src/utils/rate-limiter';
import { validateEnvironment } from '../src/config/env';
import { createMcpServersConfig } from '../src/config/mcp.config';
import { ReportGenerator } from '../src/utils/report-generator';

const report = {
  pullRequest: { owner: 'acme', repo: 'widget', number: 12 },
  fileReviews: [{
    file: 'src/index.ts',
    codeQuality: {
      file: 'src/index.ts',
      issues: [],
      overallScore: 92,
      summary: 'No material issues found.'
    },
    testCoverage: {
      file: 'src/index.ts',
      hasTests: true,
      testFiles: ['src/index.test.ts'],
      untestedPaths: [],
      coverageEstimate: 88,
      summary: 'Core paths are covered.'
    },
    refactorings: {
      file: 'src/index.ts',
      suggestions: [],
      summary: 'No refactoring is needed.'
    }
  }],
  summary: {
    totalFiles: 1,
    overallScore: 92,
    criticalIssues: 0,
    highPriorityTests: 0,
    refactoringOpportunities: 0
  },
  recommendations: [],
  metadata: {
    analyzedAt: '2026-09-25T00:00:00.000Z',
    duration: 125,
    agentVersions: { orchestrator: '1.0.0' }
  }
};

describe('CodeReviewOrchestrator', () => {
  it('rejects invalid pull request identifiers before starting agents', async () => {
    const orchestrator = new CodeReviewOrchestrator();

    await expect(orchestrator.reviewPullRequest('', 'widget', 12))
      .rejects.toMatchObject({
        name: 'ReviewError',
        code: ErrorCodes.INVALID_CONFIG
      });
    await expect(orchestrator.reviewPullRequest('acme', 'widget', 0))
      .rejects.toMatchObject({
        name: 'ReviewError',
        code: ErrorCodes.INVALID_CONFIG
      });
  });
});

describe('ReviewReportSchema', () => {
  it('accepts a complete report and rejects incomplete report data', () => {
    expect(ReviewReportSchema.safeParse(report).success).toBe(true);
    expect(ReviewReportSchema.safeParse({
      ...report,
      summary: { totalFiles: 1 }
    }).success).toBe(false);
    expect(ReviewReportSchema.safeParse({
      ...report,
      fileReviews: [{ ...report.fileReviews[0], codeQuality: { ...report.fileReviews[0].codeQuality, issues: [{ line: 1, severity: 'urgent', category: 'security', description: 'bad', suggestion: 'fix' }] } }]
    }).success).toBe(false);
  });
});

describe('ReportGenerator', () => {
  it('serializes reports as JSON, Markdown, and HTML', () => {
    const generator = new ReportGenerator();
    const parsed = ReviewReportSchema.parse(report);

    expect(JSON.parse(generator.generateJSONReport(parsed))).toEqual(report);
    expect(generator.generateMarkdownReport(parsed)).toContain('src/index.ts');
    expect(generator.generateMarkdownReport(parsed)).toContain('92/100');
    expect(generator.generateHTMLReport(parsed)).toContain('Overall Score');
    expect(generator.generateHTMLReport(parsed)).toContain('125ms');
  });
});

describe('RateLimiter', () => {
  it('tracks request and token limits and releases concurrency slots', async () => {
    const limiter = new RateLimiter({
      maxRequestsPerMinute: 1,
      maxTokensPerMinute: 100,
      maxConcurrent: 1
    });

    expect(limiter.canProceed(80)).toBe(true);
    await limiter.acquire(80);
    expect(limiter.canProceed(1)).toBe(false);
    expect(limiter.getStatus()).toMatchObject({
      activeRequests: 1,
      requestsInWindow: 1,
      tokensInWindow: 80
    });

    limiter.release(60);
    expect(limiter.getStatus()).toMatchObject({
      activeRequests: 0,
      tokensInWindow: 60
    });
  });
});

describe('withRetry', () => {
  it('returns a later successful attempt', async () => {
    let attempts = 0;
    const value = await withRetry(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('temporary');
      return 'recovered';
    }, 2, 0);

    expect(value).toBe('recovered');
    expect(attempts).toBe(2);
  });

  it('wraps the final failure with retry metadata', async () => {
    await expect(withRetry(async () => {
      throw new Error('unavailable');
    }, 1, 0)).rejects.toMatchObject({
      name: 'ReviewError',
      code: ErrorCodes.RETRY_EXHAUSTED,
      metadata: { maxRetries: 1 }
    });

    expect(new ReviewError('invalid', ErrorCodes.INVALID_CONFIG).code)
      .toBe(ErrorCodes.INVALID_CONFIG);
  });
});


describe('withTimeout', () => {
  it('returns the operation result before the deadline', async () => {
    await expect(withTimeout(async () => 'done', 100)).resolves.toBe('done');
  });

  it('rejects with a typed timeout error', async () => {
    vi.useFakeTimers();
    try {
      const operation = withTimeout(() => new Promise<string>(() => {}), 25, 'slow operation');
      const assertion = expect(operation).rejects.toMatchObject({
        name: 'ReviewError',
        code: ErrorCodes.AGENT_TIMEOUT,
        message: 'slow operation'
      });
      await vi.advanceTimersByTimeAsync(25);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('RateLimiter sliding window', () => {
  it('expires requests after the 60-second window', async () => {
    vi.useFakeTimers();
    try {
      const limiter = new RateLimiter({ maxRequestsPerMinute: 1, maxTokensPerMinute: 100, maxConcurrent: 1 });
      await limiter.acquire(20);
      limiter.release();
      expect(limiter.canProceed()).toBe(false);
      await vi.advanceTimersByTimeAsync(60001);
      expect(limiter.canProceed()).toBe(true);
      expect(limiter.getStatus().requestsInWindow).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe.skip('GitHub PR integration (requires credentials and network)', () => {
  it('reviews octocat/Hello-World#1 and produces at least one file review', async () => {
    const result = await new CodeReviewOrchestrator().reviewPullRequest('octocat', 'Hello-World', 1);
    expect(result.fileReviews.length).toBeGreaterThan(0);
  });
});


describe('configuration', () => {
  it('requires model, authentication, and GitHub credentials', () => {
    expect(() => validateEnvironment({})).toThrow(/Authentication required/);
    expect(() => validateEnvironment({ ANTHROPIC_API_KEY: 'test', ANTHROPIC_MODEL: 'test-model' })).toThrow(/GITHUB_TOKEN is required/);
    expect(validateEnvironment({ ANTHROPIC_API_KEY: 'test', ANTHROPIC_MODEL: 'test-model', GITHUB_TOKEN: 'github-test' }).githubToken).toBe('github-test');
  });

  it('passes the validated GitHub token to the MCP server without an empty fallback', () => {
    expect(createMcpServersConfig('github-test').github.env).toMatchObject({
      GITHUB_PERSONAL_ACCESS_TOKEN: 'github-test'
    });
    expect(() => createMcpServersConfig('')).toThrow(/GITHUB_TOKEN is required/);
  });
});
