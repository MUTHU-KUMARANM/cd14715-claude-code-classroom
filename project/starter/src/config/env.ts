export interface AppEnvironment {
  anthropicModel: string;
  githubToken: string;
  authentication: 'anthropic' | 'bedrock';
}

export function validateEnvironment(env: NodeJS.ProcessEnv = process.env): AppEnvironment {
  const hasAnthropicApiKey = Boolean(env.ANTHROPIC_API_KEY);
  const hasAwsCredentials = Boolean(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY);
  if (!hasAnthropicApiKey && !hasAwsCredentials) throw new Error('Authentication required. Configure ANTHROPIC_API_KEY or both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
  if (hasAwsCredentials && !hasAnthropicApiKey && !env.AWS_REGION) throw new Error('AWS_REGION is required when using AWS Bedrock authentication.');
  if (!env.ANTHROPIC_MODEL) throw new Error('ANTHROPIC_MODEL is required.');
  if (!env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required to fetch pull-request data via GitHub MCP. Create a GitHub token with repo/read access and add it to your .env file.');
  return { anthropicModel: env.ANTHROPIC_MODEL, githubToken: env.GITHUB_TOKEN, authentication: hasAwsCredentials && !hasAnthropicApiKey ? 'bedrock' : 'anthropic' };
}
