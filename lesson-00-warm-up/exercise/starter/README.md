# Warm-Up Exercise: Getting Started with Your Workspace

## Objective
Familiarize yourself with the Vocareum workspace, Claude Code CLI, and the Claude Agent SDK — the core tools you'll use throughout this course.

## Learning Goals
- Navigate the Vocareum workspace confidently
- Use Claude Code in the terminal to perform tasks interactively
- Understand the environment variables available in your workspace
- Run a TypeScript program that uses the Claude Agent SDK

## Part 1: Explore the Vocareum Workspace

Take a moment to look around the workspace interface:

1. **Open the terminal** — you'll find it at the bottom of the workspace. This is where you'll run all commands in the course.
2. **Browse the file tree** — on the left side, explore the folders. Each `lesson-XX-*` directory corresponds to a skill pair in the course and contains a `demo/` and `exercise/` folder.
3. **Check your tools** — run the following commands and note the output:

```bash
# Check Node.js version
node --version

# Check TypeScript runner
npx tsx --version

# Confirm the repo root
pwd

# See what's in the repo
ls
```

## Part 2: Inspect Environment Variables

Your workspace comes pre-configured with environment variables that the course code depends on. Run:

```bash
printenv | grep -E "ANTHROPIC|CLAUDE"
```

You should see variables like:
- `ANTHROPIC_API_KEY` — your API key for calling Claude (already set for you)
- `ANTHROPIC_MODEL` — the default model ID used by the course exercises

> **Note:** You don't need to set these yourself. They're provided by the Vocareum workspace so you can focus on learning, not configuration.

## Part 3: Run Claude Code

Claude Code is an AI-powered CLI tool that runs directly in your terminal. It's already installed in this workspace, and you'll use it as a learning companion throughout the course. We cover it in depth in Lesson 4, but feel free to use it from day one.

1. **Start Claude Code** by typing:

```bash
claude
```

2. **Give it a simple task.** Type the following prompt (or something similar) into the Claude Code session:

```
Explain what this repository is about by reading the top-level package.json
```

3. **Observe what happens.** Notice how Claude Code:
   - Reads files from the project on its own
   - Reasons about what it finds
   - Responds with a clear answer

4. **Try a few more things.** Ask Claude Code:

```
List all the lesson topics in this repo
```

```
What environment variables are set that relate to Anthropic or Claude?
```

5. **Exit** the Claude Code session by typing `/exit` or pressing `Ctrl+C`.

> **Tip:** Throughout this course, you can launch Claude Code at any time to ask questions about the code you're working on, get explanations, or debug issues. Think of it as a knowledgeable pair-programming partner.

## Part 4: Run a Claude Agent SDK Script

In Part 3 you asked Claude to describe the repo interactively. Now let's do the exact same thing from TypeScript code using the Claude Agent SDK.

1. **Install dependencies** (from the repo root):

```bash
npm install --workspace lesson-00-warm-up/exercise/starter
```

2. **Read the script** — open `src/hello-agent.ts` and look through it. It's short! Notice how it:
   - Imports `query` from the Claude Agent SDK
   - Sends a prompt asking Claude to describe the repository
   - Gives Claude the `Read` tool so it can open files on its own
   - Streams the result and prints it

3. **Run it:**

```bash
cd lesson-00-warm-up/exercise/starter
npm start
```

4. **Compare the output** to what Claude Code told you in Part 3. The script gave Claude the same tools and the same task — but this time it ran from code you can inspect, modify, and build on. This is the pattern you'll follow in the exercises throughout the course.

## What You Just Learned

- **Vocareum workspace** — where all your course work happens. The terminal, file tree, and pre-configured environment are ready for you.
- **Environment variables** — your API key and model are pre-set; you don't need to configure them.
- **Claude Code** — an interactive CLI you can use anytime to explore code, ask questions, and get help. It can read files, run commands, and reason about your project. We'll cover it in depth in Lesson 4, but it's available to you right now.
- **Claude Agent SDK** — the TypeScript library that powers the exercises in this course. You just saw how a few lines of code can give Claude tools and a task — the same way Claude Code works under the hood.

You're all set — on to the first lesson!
