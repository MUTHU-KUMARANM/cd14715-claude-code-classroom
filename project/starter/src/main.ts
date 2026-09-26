import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { CodeReviewOrchestrator } from './orchestrator';
import { validateEnvironment } from './config/env';
import { ReportGenerator } from './utils/report-generator';
import { ReviewError, formatError } from './utils/error-handler';

dotenv.config();

async function main(): Promise<void> {
  const [owner, repo, prStr] = process.argv.slice(2);
  if (!owner || !repo || !prStr) {
    console.error('Usage: npm run dev -- <owner> <repo> <pr-number>');
    process.exit(1);
  }
  const prNumber = Number(prStr);
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    console.error('Error: PR number must be a positive integer.');
    process.exit(1);
  }

  let environment;
  try {
    environment = validateEnvironment();
  } catch (error) {
    console.error(\`❌ \${error instanceof Error ? error.message : String(error)}\`);
    process.exit(1);
  }
  console.log(environment.authentication === 'bedrock' ? 'Using AWS Bedrock authentication' : 'Using Anthropic API authentication');

  const startTime = Date.now();
  try {
    console.log(\`Reviewing \${owner}/\${repo}#\${prNumber}...\`);
    const orchestrator = new CodeReviewOrchestrator();
    const report = await orchestrator.reviewPullRequest(owner, repo, prNumber);
    const finalReport = { ...report, metadata: { ...report.metadata, duration: Date.now() - startTime } };
    const reportGenerator = new ReportGenerator();
    const reportsDir = path.resolve('reports');
    await fs.mkdir(reportsDir, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(reportsDir, 'report.json'), reportGenerator.generateJSONReport(finalReport), 'utf8'),
      fs.writeFile(path.join(reportsDir, 'report.md'), reportGenerator.generateMarkdownReport(finalReport), 'utf8'),
      fs.writeFile(path.join(reportsDir, 'report.html'), reportGenerator.generateHTMLReport(finalReport), 'utf8')
    ]);
    console.log('Code review completed successfully.');
    console.log(\`Reports written to: \${reportsDir}\`);
    console.log(\`Duration: \${finalReport.metadata.duration}ms\`);
  } catch (error) {
    console.error(\`Review failed: \${error instanceof ReviewError ? formatError(error) : error instanceof Error ? error.message : String(error)}\`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(\`Review failed: \${error instanceof Error ? error.message : String(error)}\`);
  process.exit(1);
});
