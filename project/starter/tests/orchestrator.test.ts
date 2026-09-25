import { describe, expect, it } from 'vitest';
import { CodeReviewOrchestrator } from '../src/orchestrator';
import { ReviewReportSchema } from '../src/types/report-types';
import { ReviewError, ErrorCodes, withRetry } from '../src/utils/error-handler';
import { RateLimiter } from '../src/utils/rate-limiter';
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
    expect(generator.generateHTMLReport(parsed)).toContain('acme');
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
