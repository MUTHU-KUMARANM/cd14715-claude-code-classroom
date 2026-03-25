# Designing Agentic Workflows

Learn the fundamental differences between traditional prompt-response systems and agentic systems.

## Overview

This demo explores how to design agents that can use tools, iterate on tasks, and coordinate with other agents to solve complex problems.

## Scenario

A company wants to automate their customer research process. Instead of a single prompt ("research this company"), they need an agent that can autonomously search the web, analyze findings, follow up on interesting leads, and compile a comprehensive report.

> **Note:** This is a documentation-only lesson. No code execution is required — just read through the concepts and study the `ARCHITECTURE.md` deliverable.

> **Diagrams:** `ARCHITECTURE.md` displays pre-rendered SVG images from the `diagrams/` folder. To modify a diagram, edit the corresponding `.mmd` source file and re-render with `mmdc`.
>
> **Rendering Diagrams:**
> The `@mermaid-js/mermaid-cli` package is installed at the project root. From the project root directory, run:
> ```bash
> npx mmdc -i lesson-03-agentic-architecture/demo/diagrams/<name>.mmd -o lesson-03-agentic-architecture/demo/diagrams/<name>.svg
> ```
>
> Example - render the single-agent diagram:
> ```bash
> npx mmdc -i lesson-03-agentic-architecture/demo/diagrams/single-agent.mmd -o lesson-03-agentic-architecture/demo/diagrams/single-agent.svg
> ```

## What You'll Learn

- What makes a system "agentic" (autonomy, tool use, iteration)
- Common agentic patterns (ReAct, tool use, delegation)
- When to use single vs. multiple agents
- How to design clear agent responsibilities
- Orchestration patterns for multi-agent systems

## Key Concepts

### Non-Agentic vs Agentic

**Non-Agentic:**
```
User → Prompt → Claude → Single Response → Done
```

**Agentic:**
```
User → Agent → Tool1 → Agent evaluates → Tool2 → ... → Final Response
```

### Orchestration Patterns

1. **Sequential Pipeline**: Agent1 → Agent2 → Agent3
2. **Parallel Processing**: Agents run simultaneously, merge results
3. **Hierarchical Delegation**: Orchestrator manages sub-orchestrators

## Deliverable

`ARCHITECTURE.md` documenting a multi-agent company research system with:
- Single vs multi-agent comparison
- Agent responsibilities and tools
- Workflow diagram showing parallel execution
- Pros/cons analysis

## Key Takeaway

Design agents with clear, focused responsibilities. Use single agents for straightforward tasks and multi-agent systems when you need parallelization or specialized expertise.

