# Solution: Multi-Agent Customer Support System

This is the complete solution for the lesson-03 exercise.

## What This Solution Demonstrates

### Architecture Design
- **Multi-agent approach** with 6 specialized agents:
  - Triage Agent (entry point, categorization)
  - Technical Agent (analyzes bugs, API issues)
  - Billing Agent (handles payments, refunds)
  - Knowledge Base Agent (searches for existing solutions)
  - Routing Agent (makes final routing decision)
  - Escalation Agent (background SLA monitoring)

### Diagrams Included

Diagrams are pre-rendered SVGs in the `diagrams/` folder. Source `.mmd` files are included for reference or modification.

**Rendering Diagrams:**
The `@mermaid-js/mermaid-cli` package is installed at the project root. To re-render after editing a source file, run from the project root:
```bash
npx mmdc -i lesson-03-agentic-architecture/exercise/solution/diagrams/<name>.mmd -o lesson-03-agentic-architecture/exercise/solution/diagrams/<name>.svg
```

Example - render the multi-agent diagram:
```bash
npx mmdc -i lesson-03-agentic-architecture/exercise/solution/diagrams/multi-agent.mmd -o lesson-03-agentic-architecture/exercise/solution/diagrams/multi-agent.svg
```

1. **System Architecture Diagram** (`diagrams/multi-agent.mmd`)
   - Shows all agents and their relationships
   - Demonstrates parallel execution paths
   - Color-coded by agent type

2. **Workflow Diagram** (`diagrams/workflow.mmd`)
   - Complete ticket journey from submission to resolution
   - Decision logic for routing (alt/else conditions)
   - Parallel analysis stage clearly marked
   - Four possible outcomes with percentages

3. **Sequence Diagram** (`diagrams/sequence.mmd`)
   - Timeline of interactions between components
   - Parallel execution using `par` blocks
   - Activation/deactivation of agents
   - Alternative routing paths using `alt/else`

4. **SLA Monitoring Diagram** (`diagrams/sla-monitoring.mmd`)
   - Background escalation agent design
   - Continuous monitoring approach

### Key Design Decisions

**Parallel Execution**
- Triage agent spawns Technical, Billing, and Knowledge Base agents simultaneously
- Speeds up processing from 30-60 seconds to 5-10 seconds

**Model Selection**
- Haiku for fast operations (Triage, Billing, KB, Routing)
- Sonnet for complex analysis (Technical Agent)

**Failure Resilience**
- Fallback strategies for each agent
- Graceful degradation instead of total failure
- Dead-man switch for SLA monitoring

**Scalability**
- Easy to add new agent types (e.g., Sales Agent)
- Handles 50,000+ tickets daily (10x current volume)

### Performance Estimates

- **Processing time**: 5-10 seconds per ticket (vs 30-60s single agent)
- **Daily capacity**: 50,000+ tickets (vs 2,500 single agent)
- **Auto-resolution rate**: 40%
- **SLA compliance**: 98%+ (vs 70% single agent)

## Learning Outcomes

By studying this solution, you should understand:

1. **How to design specialized agents** with clear, focused responsibilities
2. **When to use parallel vs sequential** agent execution
3. **How to create Mermaid diagrams** for system architecture, workflows, and sequences
4. **How to plan for failure** with fallback strategies
5. **How to justify architectural decisions** based on requirements

## Comparison to Starter

The starter provides:
- Problem statement and requirements
- Option A (single agent) as a reference
- TODO placeholders for all sections

This solution shows:
- Complete multi-agent design
- Professional Mermaid diagrams
- Comprehensive failure analysis
- Justified recommendation with metrics

## Next Steps

After reviewing this solution:
- Compare your design with this approach
- Identify differences in agent responsibilities
- Consider which approach better meets the requirements
- Think about how you'd implement this using the Claude Agent SDK (lessons 5-10)
