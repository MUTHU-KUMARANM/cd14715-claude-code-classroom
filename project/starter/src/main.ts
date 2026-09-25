import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { CodeReviewOrchestrator } from './orchestrator';
import { ReportGenerator } from './utils/report-generator';
import { ReviewError, formatError } from './utils/error-handler';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Claude Multi-Agent Code Review System
 *
 * Usage:
 * npm run dev -- <owner> <repo> <pr-number>
 */
async function main(): Promise<void> {
  const [owner, repo, prStr] = process.argv.slice(2);

  // Validate command line arguments
  if (!owner || !repo || !prStr) {
    console.error(
      'Usage: npm run dev -- <owner> <repo> <pr-number>'
    );
    process.exit(1);
  }

  const prNumber = Number(prStr);

  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    console.error('Error: PR number must be a positive integer.');
    process.exit(1);
  }

  // Validate authentication
  const hasAnthropicApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

  const hasAwsCredentials =
    Boolean(process.env.AWS_ACCESS_KEY_ID) &&
    Boolean(process.env.AWS_SECRET_ACCESS_KEY);

  if (!hasAnthropicApiKey && !hasAwsCredentials) {
    console.error(
      'Authentication required. Configure either:\n' +
      '  - ANTHROPIC_API_KEY for Anthropic API, or\n' +
      '  - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY for AWS Bedrock.'
    );
    process.exit(1);
  }

  if (hasAwsCredentials && !hasAnthropicApiKey) {
    if (!process.env.AWS_REGION) {
      console.error(
        'AWS_REGION is required when using AWS Bedrock authentication.'
      );
      process.exit(1);
    }

    console.log('🔐 Using AWS Bedrock authentication');
  } else {
    console.log('🔐 Using Anthropic API authentication');
  }

  // Validate model
  if (!process.env.ANTHROPIC_MODEL) {
    console.error('ANTHROPIC_MODEL is required.');
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    console.log(
      `🔍 Reviewing ${owner}/${repo}#${prNumber}...`
    );

    const orchestrator = new CodeReviewOrchestrator();

    const report = await orchestrator.reviewPullRequest(
      owner,
      repo,
      prNumber
    );

    const duration = Date.now() - startTime;

    const finalReport = {
      ...report,
      metadata: {
        ...report.metadata,
        duration
      }
    };

    const reportGenerator = new ReportGenerator();

    const jsonReport =
      reportGenerator.generateJSONReport(finalReport);

    const markdownReport =
      reportGenerator.generateMarkdownReport(finalReport);

    const htmlReport =
      reportGenerator.generateHTMLReport(finalReport);

    const reportsDir = path.resolve('reports');

    await fs.mkdir(reportsDir, { recursive: true });

    const baseName = `${owner}-${repo}-pr-${prNumber}`;

    await Promise.all([
      fs.writeFile(
        path.join(reportsDir, `${baseName}.json`),
        jsonReport,
        'utf8'
      ),
      fs.writeFile(
        path.join(reportsDir, `${baseName}.md`),
        markdownReport,
        'utf8'
      ),
      fs.writeFile(
        path.join(reportsDir, `${baseName}.html`),
        htmlReport,
        'utf8'
      )
    ]);

    console.log('✅ Code review completed successfully.');
    console.log(`📁 Reports written to: ${reportsDir}`);
    console.log(`⏱️ Duration: ${duration}ms`);
  } catch (error) {
    if (error instanceof ReviewError) {
      console.error(`❌ ${formatError(error)}`);
    } else {
      console.error(
        `❌ ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    }

    process.exit(1);
  }
}

main().catch((error) => {
  console.error(
    `❌ ${
      error instanceof Error
        ? error.message
        : String(error)
    }`
  );
  process.exit(1);
});