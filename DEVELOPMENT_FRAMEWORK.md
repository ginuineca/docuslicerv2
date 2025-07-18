# DocuSlicer Development Framework & AI Programming Rules

## 1. Infrastructure Setup & Tool Integration

### GitHub Repository Structure
```
docuslicer/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # Test & lint on PR
│   │   ├── deploy-staging.yml     # Deploy to staging
│   │   └── deploy-production.yml  # Deploy to prod
│   ├── PULL_REQUEST_TEMPLATE.md   # PR checklist
│   └── ISSUE_TEMPLATE/            # Bug reports, features
├── apps/
│   ├── web/                       # React frontend
│   │   ├── src/
│   │   │   ├── components/        # Reusable UI components
│   │   │   ├── pages/             # Route components
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   ├── utils/             # Helper functions
│   │   │   ├── types/             # TypeScript definitions
│   │   │   └── stores/            # State management
│   │   ├── public/                # Static assets
│   │   └── tests/                 # Frontend tests
│   └── api/                       # Node.js backend
│       ├── src/
│       │   ├── routes/            # API endpoints
│       │   ├── middleware/        # Express middleware
│       │   ├── services/          # Business logic
│       │   ├── models/            # Database models
│       │   ├── utils/             # Helper functions
│       │   └── types/             # TypeScript definitions
│       └── tests/                 # Backend tests
├── packages/
│   ├── shared/                    # Shared code between apps
│   │   ├── types/                 # Shared TypeScript types
│   │   ├── utils/                 # Shared utilities
│   │   └── constants/             # Shared constants
│   └── ui/                        # Shared UI components
├── infra/
│   ├── terraform/                 # Infrastructure as code
│   ├── docker/                    # Container configs
│   └── scripts/                   # Deployment scripts
├── docs/
│   ├── api/                       # API documentation
│   ├── deployment/                # Deployment guides
│   └── development/               # Development setup
├── .ai/                           # AI Context Directory
│   ├── context.md                 # Full project context
│   ├── coding-standards.md        # Coding rules
│   ├── architecture.md            # System architecture
│   ├── database-schema.md         # Database structure
│   └── workflows/                 # Common development tasks
├── .env.example                   # Environment variables template
├── docker-compose.yml             # Local development
├── package.json                   # Root package.json (workspaces)
└── README.md                      # Project overview
```

### DigitalOcean Setup Commands
```bash
# Create Droplet with Docker
doctl compute droplet create docuslicer-prod \
  --image docker-20-04 \
  --size s-2vcpu-4gb \
  --region nyc1 \
  --ssh-keys your-ssh-key-id

# Setup domain and load balancer
doctl compute load-balancer create \
  --name docuslicer-lb \
  --forwarding-rules entry_protocol:https,entry_port:443,target_protocol:http,target_port:80
```

### Supabase Integration
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase project
supabase init

# Link to remote project
supabase link --project-ref your-project-ref

# Generate TypeScript types
supabase gen types typescript --local > apps/shared/types/database.ts
```

## 2. Context Engineering Framework

### AI Context Architecture
Context Engineering is the discipline of designing and building dynamic systems that provides the right information and tools, in the right format, at the right time, to give a LLM everything it needs to accomplish a task.

### Full Context Document Structure (`.ai/context.md`)
```markdown
# DocuSlicer Full Project Context

## Project Overview
DocuSlicer is a PDF workflow automation SaaS platform built with:
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + PostgreSQL
- Infrastructure: DigitalOcean + Supabase + Cloudflare
- Payment: Stripe subscriptions

## Current Architecture
[Include complete system diagram and component relationships]

## Database Schema
[Include all tables, relationships, and constraints]

## API Specifications
[Include all endpoints, request/response formats]

## Business Logic Rules
[Include all workflow rules, pricing logic, user permissions]

## Current Issues & Technical Debt
[Maintain list of known issues and refactoring needs]

## Recent Changes
[Keep log of recent significant changes for context]
```

### Context Engineering Best Practices

#### 1. Contextual Information Layers
```markdown
# Information Hierarchy for AI Programming Tasks

## Core Context (Always Include)
- Project type: SaaS PDF automation platform
- Tech stack: React, Node.js, PostgreSQL, TypeScript
- Architecture pattern: Monorepo with separate frontend/backend
- Database: Supabase (PostgreSQL + Auth + Storage)
- Deployment: DigitalOcean + Docker
- Payment: Stripe subscriptions

## Task-Specific Context
- Feature being worked on
- Related components and dependencies  
- Business logic requirements
- Performance requirements
- Security considerations

## Code Context
- Existing code patterns in the project
- Naming conventions used
- Error handling patterns
- Testing patterns
- File organization structure

## Environmental Context
- Development vs production differences
- Environment variables needed
- External service configurations
- Deployment requirements
```

#### 2. Dynamic Context Assembly
Context isn't just a static prompt template. It's the output of a system that runs before the main LLM call. Dynamic: Created on the fly, tailored to the immediate task.

```typescript
// Context Assembly System
interface TaskContext {
  projectInfo: ProjectMetadata;
  codeContext: RelevantCodeFiles;
  requirements: FeatureRequirements;
  constraints: TechnicalConstraints;
  examples: CodeExamples;
}

function assembleContext(task: DevelopmentTask): TaskContext {
  return {
    projectInfo: getProjectMetadata(),
    codeContext: getRelevantFiles(task.scope),
    requirements: parseRequirements(task.description),
    constraints: getProjectConstraints(),
    examples: getPatternExamples(task.type)
  };
}
```

## 3. AI Programming Rules & Standards

### Core Programming Principles

#### 1. **Always-First Rules**
```markdown
1. **TypeScript First**: All code must be TypeScript with strict mode
2. **Test-Driven**: Write tests before implementation  
3. **Schema-First**: Define database/API schemas before coding
4. **Security-First**: Validate all inputs, sanitize all outputs
5. **Performance-First**: Consider performance implications upfront
```

#### 2. **Code Quality Standards**
```typescript
// Example: Function structure with full context
/**
 * Processes PDF workflow execution
 * 
 * Context: Part of workflow engine service
 * Dependencies: WorkflowValidator, PDFProcessor, FileStorage
 * Performance: Must handle 100+ concurrent workflows
 * Error handling: Retry with exponential backoff
 */
export async function executeWorkflow(
  workflowId: string,
  userId: string,
  inputFiles: FileReference[]
): Promise<WorkflowResult> {
  // Validation
  const workflow = await validateWorkflow(workflowId, userId);
  const validatedFiles = await validateInputFiles(inputFiles);
  
  // Processing with error handling
  try {
    return await processWorkflowSteps(workflow, validatedFiles);
  } catch (error) {
    await logWorkflowError(workflowId, error);
    throw new WorkflowExecutionError(error.message, { workflowId, userId });
  }
}
```

#### 3. **Error Handling Patterns**
```typescript
// Standardized error classes
export class DocuSlicerError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DocuSlicerError {
  constructor(message: string, field: string, value: any) {
    super(message, 'VALIDATION_ERROR', { field, value });
  }
}

// Usage in functions
function validatePDFFile(file: File): void {
  if (!file.type.includes('pdf')) {
    throw new ValidationError('File must be PDF', 'type', file.type);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError('File too large', 'size', file.size);
  }
}
```

### AI-Specific Programming Rules

#### 1. **Context-Aware Code Generation**
Developers who experience fewer than 20% hallucinations are 2.5x more likely to merge code without reviewing it. High-confidence engineers are 1.3x more likely to say AI makes their job more enjoyable.

```markdown
When requesting code from AI, always provide:

## Required Context
- Exact file path where code will be placed
- Existing code patterns from the same file/directory
- Function signatures of related functions
- TypeScript interfaces being used
- Error handling patterns in use
- Testing patterns expected

## Example Request Format
"Generate a function to handle PDF splitting in `apps/api/src/services/pdf-processor.ts`

Existing patterns in this file:
- All functions are async/await
- Errors use DocuSlicerError classes
- Logging uses structured format with context
- Functions return Promise<ServiceResult<T>>

Function signature needed:
`async function splitPDF(fileId: string, pages: PageRange[]): Promise<ServiceResult<SplitResult>>`

Related interfaces:
[Include relevant TypeScript interfaces]

Testing pattern expected:
[Include example test structure]"
```

#### 2. **Iterative Refinement Rules**
```markdown
1. **Start Small**: Request minimal viable implementation first
2. **Add Context**: Provide feedback with specific context about issues
3. **Reference Patterns**: Always point to existing code patterns
4. **Validate Incrementally**: Test each piece before moving to next
5. **Document Changes**: Update context files after each iteration
```

#### 3. **Context Validation Checklist**
```markdown
Before submitting code generation request:
□ Project context document is up to date
□ Relevant existing code is included in prompt
□ TypeScript interfaces are defined
□ Error handling pattern is specified
□ Testing approach is clear
□ Performance requirements are stated
□ Security considerations are noted
□ Integration points are identified
```

## 4. Development Workflow Optimization

### Automated Quality Gates

#### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality_gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type checking
        run: npm run type-check

      - name: Lint code
        run: npm run lint

      - name: Run tests
        run: npm run test:coverage

      - name: Build applications
        run: npm run build

      - name: Security audit
        run: npm audit --audit-level high

      - name: Database migration check
        run: npm run db:validate
```

#### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run type-check",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{md,json}": ["prettier --write"]
  }
}
```

### Refactoring Rules

#### 1. **Continuous Refactoring Triggers**
```markdown
Refactor immediately when:
- Function exceeds 50 lines
- File exceeds 300 lines
- Cyclomatic complexity > 10
- Test coverage drops below 80%
- TypeScript any usage increases
- Duplicate code patterns emerge (DRY violation)
```

#### 2. **Refactoring Checklist**
```markdown
Before refactoring:
□ All tests are passing
□ Current behavior is documented
□ Refactoring scope is clearly defined
□ Breaking changes are identified
□ Rollback plan exists

During refactoring:
□ One change at a time
□ Tests updated with each change
□ Context documentation updated
□ Performance impact measured

After refactoring:
□ All tests still passing
□ Performance unchanged or improved
□ Code coverage maintained
□ Documentation updated
□ Team notified of changes
```

## 5. Context Engineering Implementation

### Project Knowledge Base Structure
```markdown
.ai/
├── context.md              # Master context document
├── coding-standards.md     # Coding rules and patterns
├── architecture.md         # System design and components
├── database-schema.md      # Complete database structure
├── api-specifications.md   # All API endpoints and contracts
├── business-rules.md       # Business logic and workflows
├── performance-requirements.md # Performance benchmarks
├── security-guidelines.md  # Security patterns and requirements
├── testing-strategies.md   # Testing approaches and patterns
├── deployment-procedures.md # Deployment and infrastructure
└── workflows/
    ├── new-feature.md      # Template for new features
    ├── bug-fix.md          # Template for bug fixes
    ├── refactoring.md      # Template for refactoring
    └── integration.md      # Template for integrations
```

### Context Assembly Automation
```typescript
// .ai/scripts/assemble-context.ts
/**
 * Automatically assembles relevant context for AI programming tasks
 */
export async function assembleTaskContext(
  task: string,
  filesPaths: string[]
): Promise<string> {
  const context = {
    projectOverview: await readFile('.ai/context.md'),
    codingStandards: await readFile('.ai/coding-standards.md'),
    relevantCode: await getRelevantCodeFiles(filesPaths),
    databaseSchema: await readFile('.ai/database-schema.md'),
    apiSpecs: await readFile('.ai/api-specifications.md'),
    businessRules: await readFile('.ai/business-rules.md'),
    recentChanges: await getRecentChanges(7), // Last 7 days
    relatedIssues: await getRelatedIssues(task)
  };

  return formatContextForAI(context, task);
}
```

### AI Prompt Templates
```markdown
# Feature Development Template
You are an expert full-stack developer working on DocuSlicer, a PDF workflow automation SaaS platform.

## Project Context
{PROJECT_CONTEXT}

## Task
{TASK_DESCRIPTION}

## Requirements
{SPECIFIC_REQUIREMENTS}

## Existing Code Patterns
{RELEVANT_CODE_EXAMPLES}

## Constraints
- Must follow TypeScript strict mode
- Must include comprehensive error handling
- Must include unit tests
- Must follow existing code patterns
- Must consider performance implications
- Must validate all inputs

## Expected Output
- Complete implementation with TypeScript types
- Comprehensive error handling
- Unit tests
- Documentation comments
- Integration points identified

Generate code that seamlessly integrates with the existing codebase and follows all established patterns.
```

## 6. Monitoring & Continuous Improvement

### Code Quality Metrics
```typescript
// Quality tracking
interface QualityMetrics {
  testCoverage: number;        // Target: >80%
  typeScriptStrict: number;    // Target: 100%
  lintErrors: number;          // Target: 0
  duplicateCode: number;       // Target: <5%
  cyclomaticComplexity: number; // Target: <10
  techDebtHours: number;       // Track and reduce
}
```

### AI Effectiveness Tracking
```markdown
Track these metrics to improve AI programming effectiveness:

## Code Quality from AI
- Lines of AI-generated code that pass review without changes
- AI-generated code that requires refactoring
- AI suggestions that introduce bugs
- Time saved vs time spent reviewing AI code

## Context Engineering Effectiveness
- Accuracy of AI responses when full context provided
- Frequency of context updates needed
- Time to provide sufficient context vs coding time saved
- Developer satisfaction with AI assistance
```

## 7. Getting Started Checklist

### Initial Setup
```bash
# 1. Repository setup
git clone <docuslicer-repo>
cd docuslicer
npm install

# 2. Environment setup
cp .env.example .env.local
# Fill in environment variables

# 3. Database setup
supabase start
npm run db:reset
npm run db:seed

# 4. Development server
npm run dev

# 5. Context initialization
npm run ai:init-context
```

### Daily Development Workflow
```markdown
## Start of Day
1. Pull latest changes: `git pull origin main`
2. Update context: `npm run ai:update-context`
3. Review yesterday's changes in context docs
4. Plan today's tasks with context requirements

## During Development
1. Use context assembly for each AI interaction
2. Update relevant context files as you code
3. Run quality checks frequently: `npm run quality:check`
4. Commit early and often with clear messages

## End of Day
1. Update context with new learnings
2. Document any technical debt introduced
3. Update architecture docs if structure changed
4. Push all changes and update project status
```

This framework ensures that every AI interaction has the full context needed for high-quality code generation while maintaining strict quality standards and continuous improvement of both code and context.

---

# File Size Management & Refactoring Guide

## 1. File Size Limits & Triggers

### Recommended File Size Limits
```typescript
// Automated file size monitoring
const FILE_SIZE_LIMITS = {
  // Lines of Code (LOC)
  COMPONENT: 200,           // React components
  SERVICE: 300,             // Business logic services
  UTILITY: 150,             // Utility functions
  MODEL: 250,               // Data models/types
  API_ROUTE: 100,           // API endpoint handlers
  TEST_FILE: 400,           // Test files (can be larger)

  // File size in KB
  MAX_FILE_SIZE_KB: 50,     // Physical file size limit

  // Complexity metrics
  MAX_CYCLOMATIC_COMPLEXITY: 10,
  MAX_FUNCTIONS_PER_FILE: 15,
  MAX_EXPORTS_PER_FILE: 10
};
```

### Refactoring Triggers (Automated Alerts)
```typescript
// .eslintrc.js - Custom rules for file size monitoring
module.exports = {
  rules: {
    // Trigger refactoring when file exceeds limits
    'max-lines': ['warn', { max: 300, skipBlankLines: true }],
    'max-lines-per-function': ['warn', { max: 50 }],
    'complexity': ['warn', { max: 10 }],
    'max-params': ['error', 4],
    'max-depth': ['error', 4],
    'max-nested-callbacks': ['error', 3]
  }
};
```

## 2. File Type-Specific Refactoring Strategies

### React Components
```typescript
// ❌ Large component file (300+ lines)
const LargeWorkflowBuilder = () => {
  // State management (50 lines)
  // Event handlers (80 lines)
  // Validation logic (60 lines)
  // Rendering logic (120 lines)
};

// ✅ Refactored into multiple files
// WorkflowBuilder/index.tsx (Main component - 80 lines)
export const WorkflowBuilder = () => {
  const workflow = useWorkflowState();
  const handlers = useWorkflowHandlers();
  const validation = useWorkflowValidation();

  return (
    <WorkflowBuilderLayout>
      <WorkflowSteps steps={workflow.steps} />
      <WorkflowControls handlers={handlers} />
      <WorkflowPreview workflow={workflow} />
    </WorkflowBuilderLayout>
  );
};

// WorkflowBuilder/hooks/useWorkflowState.ts (50 lines)
// WorkflowBuilder/hooks/useWorkflowHandlers.ts (60 lines)
// WorkflowBuilder/hooks/useWorkflowValidation.ts (40 lines)
// WorkflowBuilder/components/WorkflowSteps.tsx (80 lines)
// WorkflowBuilder/components/WorkflowControls.tsx (70 lines)
// WorkflowBuilder/components/WorkflowPreview.tsx (90 lines)
```

### API Services
```typescript
// ❌ Large service file (400+ lines)
class PDFService {
  async split() { /* 80 lines */ }
  async merge() { /* 70 lines */ }
  async convert() { /* 90 lines */ }
  async compress() { /* 60 lines */ }
  async validate() { /* 100 lines */ }
}

// ✅ Refactored into specialized services
// services/pdf/index.ts (Main orchestrator - 50 lines)
export class PDFService {
  constructor(
    private splitter = new PDFSplitter(),
    private merger = new PDFMerger(),
    private converter = new PDFConverter(),
    private compressor = new PDFCompressor(),
    private validator = new PDFValidator()
  ) {}

  async processWorkflow(workflow: PDFWorkflow) {
    for (const step of workflow.steps) {
      await this.executeStep(step);
    }
  }
}

// services/pdf/splitter.ts (80 lines)
// services/pdf/merger.ts (70 lines)
// services/pdf/converter.ts (90 lines)
// services/pdf/compressor.ts (60 lines)
// services/pdf/validator.ts (100 lines)
```

## 3. Refactoring Patterns & Strategies

### 1. Extract Custom Hooks (React)
```typescript
// Before: Large component with inline logic
const WorkflowEditor = () => {
  const [workflow, setWorkflow] = useState();
  const [errors, setErrors] = useState();
  const [loading, setLoading] = useState();

  const validateStep = useCallback(() => {
    // 30 lines of validation logic
  }, []);

  const handleStepAdd = useCallback(() => {
    // 25 lines of step addition logic
  }, []);

  // 150+ more lines...
};

// After: Extract hooks
const WorkflowEditor = () => {
  const workflow = useWorkflowState();
  const validation = useWorkflowValidation(workflow);
  const handlers = useWorkflowHandlers(workflow, validation);

  return <WorkflowEditorUI {...workflow} {...handlers} />;
};

// hooks/useWorkflowState.ts (40 lines)
// hooks/useWorkflowValidation.ts (50 lines)
// hooks/useWorkflowHandlers.ts (60 lines)
```

### 2. Service Layer Decomposition
```typescript
// Before: Monolithic service
class WorkflowService {
  async create() { /* 50 lines */ }
  async execute() { /* 80 lines */ }
  async validate() { /* 60 lines */ }
  async schedule() { /* 40 lines */ }
  async monitor() { /* 70 lines */ }
}

// After: Specialized services with clear boundaries
// services/workflow/index.ts
export class WorkflowOrchestrator {
  constructor(
    private creator: WorkflowCreator,
    private executor: WorkflowExecutor,
    private validator: WorkflowValidator,
    private scheduler: WorkflowScheduler,
    private monitor: WorkflowMonitor
  ) {}
}

// services/workflow/creator.ts (50 lines)
// services/workflow/executor.ts (80 lines)
// services/workflow/validator.ts (60 lines)
// services/workflow/scheduler.ts (40 lines)
// services/workflow/monitor.ts (70 lines)
```

### 3. Utility Function Extraction
```typescript
// Before: Inline utility functions in main file
const DocumentProcessor = {
  async process(document) {
    // File validation (40 lines)
    if (!document.type.includes('pdf')) {
      throw new Error('Invalid file type');
    }
    // Size validation continues...

    // File conversion (60 lines)
    const convertedFile = await convert(document);
    // Conversion logic continues...

    // File optimization (50 lines)
    const optimizedFile = await optimize(convertedFile);
    // Optimization logic continues...
  }
};

// After: Extract to separate utility modules
// utils/file-validation.ts (40 lines)
export const validatePDFFile = (file: File): ValidationResult => {
  // Focused validation logic
};

// utils/file-conversion.ts (60 lines)
export const convertPDFFormat = (file: File, format: string): Promise<File> => {
  // Focused conversion logic
};

// utils/file-optimization.ts (50 lines)
export const optimizePDFSize = (file: File): Promise<File> => {
  // Focused optimization logic
};

// services/document-processor.ts (30 lines)
import { validatePDFFile } from '../utils/file-validation';
import { convertPDFFormat } from '../utils/file-conversion';
import { optimizePDFSize } from '../utils/file-optimization';

export const DocumentProcessor = {
  async process(document: File) {
    const validation = validatePDFFile(document);
    if (!validation.isValid) throw new ValidationError(validation.errors);

    const converted = await convertPDFFormat(document, 'optimized');
    return await optimizePDFSize(converted);
  }
};
```

## 4. Directory Structure for Large Systems

### Feature-Based Organization
```
src/
├── features/
│   ├── workflow-builder/
│   │   ├── components/          # Max 150 lines each
│   │   │   ├── WorkflowCanvas.tsx
│   │   │   ├── StepLibrary.tsx
│   │   │   └── StepConfigurator.tsx
│   │   ├── hooks/               # Max 100 lines each
│   │   │   ├── useWorkflowState.ts
│   │   │   ├── useStepDragDrop.ts
│   │   │   └── useWorkflowValidation.ts
│   │   ├── services/            # Max 200 lines each
│   │   │   ├── WorkflowService.ts
│   │   │   └── StepExecutor.ts
│   │   ├── types/               # Max 100 lines each
│   │   │   ├── workflow.types.ts
│   │   │   └── step.types.ts
│   │   └── index.ts             # Public API (< 50 lines)
│   │
│   ├── pdf-processing/
│   │   ├── components/
│   │   ├── services/
│   │   │   ├── core/            # Core PDF operations
│   │   │   │   ├── PDFSplitter.ts
│   │   │   │   ├── PDFMerger.ts
│   │   │   │   └── PDFConverter.ts
│   │   │   ├── advanced/        # Advanced operations
│   │   │   │   ├── OCRService.ts
│   │   │   │   └── AIProcessor.ts
│   │   │   └── utils/           # PDF utilities
│   │   │       ├── pdf-validator.ts
│   │   │       └── pdf-optimizer.ts
│   │   └── index.ts
│   │
│   └── user-management/
│       ├── components/
│       ├── services/
│       └── index.ts
├── shared/
│   ├── components/              # Reusable UI (< 150 lines each)
│   ├── hooks/                   # Reusable hooks (< 100 lines each)
│   ├── utils/                   # Pure functions (< 100 lines each)
│   ├── types/                   # Shared types (< 150 lines each)
│   └── constants/               # Constants (< 50 lines each)
└── lib/                         # External integrations
    ├── supabase/
    ├── stripe/
    └── storage/
```

## 5. Automated Refactoring Tools & Scripts

### File Size Monitoring Script
```typescript
// scripts/monitor-file-sizes.ts
import { glob } from 'glob';
import { readFileSync, statSync } from 'fs';

interface FileSizeReport {
  path: string;
  lines: number;
  size: number;
  complexity: number;
  needsRefactoring: boolean;
}

async function analyzeCodebase(): Promise<FileSizeReport[]> {
  const files = await glob('src/**/*.{ts,tsx}');
  const reports: FileSizeReport[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n').length;
    const size = statSync(file).size / 1024; // KB
    const complexity = calculateComplexity(content);

    const needsRefactoring = shouldRefactor(file, lines, size, complexity);

    reports.push({ path: file, lines, size, complexity, needsRefactoring });
  }

  return reports.filter(r => r.needsRefactoring);
}

function shouldRefactor(
  filePath: string,
  lines: number,
  sizeKB: number,
  complexity: number
): boolean {
  const fileType = getFileType(filePath);
  const limits = FILE_SIZE_LIMITS[fileType] || FILE_SIZE_LIMITS.SERVICE;

  return lines > limits ||
         sizeKB > FILE_SIZE_LIMITS.MAX_FILE_SIZE_KB ||
         complexity > FILE_SIZE_LIMITS.MAX_CYCLOMATIC_COMPLEXITY;
}

// Run: npm run analyze:file-sizes
```

### Automated Refactoring Suggestions
```typescript
// scripts/suggest-refactoring.ts
interface RefactoringSuggestion {
  file: string;
  issue: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high';
}

function generateRefactoringSuggestions(file: string): RefactoringSuggestion[] {
  const content = readFileSync(file, 'utf-8');
  const suggestions: RefactoringSuggestion[] = [];

  // Detect large functions
  const largeFunctions = findLargeFunctions(content);
  if (largeFunctions.length > 0) {
    suggestions.push({
      file,
      issue: `${largeFunctions.length} functions exceed 50 lines`,
      suggestion: 'Extract smaller functions or use custom hooks',
      priority: 'high'
    });
  }

  // Detect repeated patterns
  const duplicatedCode = findDuplicatedCode(content);
  if (duplicatedCode.length > 0) {
    suggestions.push({
      file,
      issue: 'Duplicated code patterns detected',
      suggestion: 'Extract shared utilities or components',
      priority: 'medium'
    });
  }

  // Detect mixed concerns
  const mixedConcerns = detectMixedConcerns(content);
  if (mixedConcerns) {
    suggestions.push({
      file,
      issue: 'File handles multiple concerns',
      suggestion: 'Split into separate modules by responsibility',
      priority: 'high'
    });
  }

  return suggestions;
}
```

## 6. Refactoring Checklist & Process

### Pre-Refactoring Checklist
```markdown
□ All tests are passing
□ File size/complexity metrics documented
□ Refactoring scope clearly defined
□ Dependencies mapped out
□ Breaking changes identified
□ Rollback plan exists
□ Team notification sent
```

### Refactoring Process
```typescript
// 1. Extract Functions First
const extractFunctions = (largeFunction: string) => {
  // Identify logical blocks
  // Extract to named functions
  // Maintain original behavior
  // Update tests
};

// 2. Extract Components/Modules
const extractModules = (largeFile: string) => {
  // Group related functionality
  // Create new files with single responsibility
  // Update imports/exports
  // Verify integration
};

// 3. Extract Services
const extractServices = (businessLogic: string) => {
  // Separate concerns (validation, processing, storage)
  // Create service interfaces
  // Implement dependency injection
  // Update consuming code
};
```

### Post-Refactoring Validation
```bash
# Automated validation script
#!/bin/bash

echo "Running post-refactoring validation..."

# 1. Type checking
npm run type-check

# 2. All tests pass
npm run test

# 3. File size compliance
npm run analyze:file-sizes

# 4. No new linting errors
npm run lint

# 5. Build succeeds
npm run build

# 6. Performance regression check
npm run test:performance

echo "✅ Refactoring validation complete"
```

## 7. Continuous Monitoring & Prevention

### GitHub Actions Integration
```yaml
# .github/workflows/file-size-check.yml
name: File Size Monitor

on: [pull_request]

jobs:
  file_size_check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check file sizes
        run: |
          npm run analyze:file-sizes

      - name: Comment PR if files need refactoring
        uses: actions/github-script@v6
        with:
          script: |
            const { execSync } = require('child_process');
            const report = execSync('npm run analyze:file-sizes --silent', { encoding: 'utf-8' });

            if (report.trim()) {
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: `⚠️ **Files Need Refactoring**\n\n${report}`
              });
            }
```

### IDE Integration
```json
// .vscode/settings.json
{
  "editor.rulers": [80, 120],
  "files.associations": {
    "*.large": "text"
  },
  "eslint.rules.customizations": [
    {
      "rule": "max-lines",
      "severity": "warn"
    }
  ],
  "todo-tree.general.tags": [
    "REFACTOR",
    "TODO",
    "FIXME"
  ]
}
```

### File Size Management Summary

This comprehensive approach ensures your files stay manageable and your codebase remains maintainable as DocuSlicer grows. The key principles are:

1. **Proactive Monitoring**: Automated file size tracking and alerts
2. **Clear Limits**: Specific line count and complexity thresholds
3. **Systematic Refactoring**: Established patterns for breaking down large files
4. **Feature-Based Organization**: Logical grouping that prevents monolithic growth
5. **Continuous Validation**: Automated checks in CI/CD pipeline
6. **Team Awareness**: Clear processes and documentation for refactoring decisions

By following these guidelines, DocuSlicer will maintain high code quality and developer productivity throughout its growth phases.
