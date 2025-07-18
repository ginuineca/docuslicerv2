# Complete AI Programmer Briefing for DocuSlicer

## 1. Critical Project Context (ALWAYS Include in Prompts)

### Project Identity
```markdown
**Project**: DocuSlicer - PDF workflow automation SaaS platform
**Tech Stack**: React + TypeScript + Node.js + PostgreSQL + Supabase
**Target**: B2B/B2C freemium model with team collaboration features
**Deployment**: DigitalOcean + Cloudflare + GitHub Actions
**Architecture**: Monorepo with separate frontend/backend, shared types
```

### Business Model Context
```typescript
// Revenue streams that code must support
const BUSINESS_MODEL = {
  freemium: {
    limits: "5 operations/month, 10MB files",
    monetization: "Upgrade prompts, feature limitations"
  },
  professional: {
    pricing: "$15/month", 
    features: "Unlimited operations, workflows, email integration"
  },
  team: {
    pricing: "$49/month",
    features: "Shared workspaces, user management, analytics"
  },
  enterprise: {
    pricing: "Custom",
    features: "SSO, API access, compliance, priority support"
  }
};
```

## 2. Forbidden Actions (NEVER Do These)

### ❌ NEVER Remove These Critical Functions
```typescript
// Security functions that must NEVER be deleted
const PROTECTED_FUNCTIONS = [
  'validatePDFFile',        // File security validation
  'sanitizeUserInput',      // XSS prevention
  'checkRateLimit',         // DoS prevention
  'verifyPayment',          // Payment validation
  'enforceUsageLimits',     // Business model enforcement
  'logSecurityEvent',       // Audit trail
  'hashPassword',           // Authentication security
  'validateWorkflowStep',   // Workflow integrity
  'checkFilePermissions',   // Access control
  'encryptSensitiveData'    // Data protection
];

// If asked to "clean up" or "optimize" code, PRESERVE these functions
// If TypeScript errors involve these functions, FIX the types, don't remove the function
```

### ❌ NEVER Make These Changes Without Explicit Permission
```markdown
1. **Database Schema Changes**: Never alter table structures, add migrations instead
2. **API Breaking Changes**: Never change existing endpoint signatures
3. **Environment Variables**: Never hardcode values that should be configurable
4. **Payment Logic**: Never modify Stripe integration without explicit review
5. **Authentication Flow**: Never bypass or simplify auth without security review
6. **File Processing**: Never remove file validation or sanitization
7. **Rate Limiting**: Never disable or weaken rate limiting logic
8. **Error Handling**: Never remove try/catch blocks or error logging
```

### ❌ Dangerous Request Patterns to Avoid
```markdown
❌ "Fix all TypeScript errors" (might remove code)
❌ "Clean up this file" (too vague, might remove important logic)
❌ "Optimize everything" (might break functionality)
❌ "Remove unused code" (might remove critical functions)
❌ "Simplify this logic" (might remove edge case handling)
❌ "Update all dependencies" (might break compatibility)
❌ "Refactor this entire module" (too broad, risky)
```

## 3. Required Patterns & Standards

### TypeScript Standards
```typescript
// Always use strict TypeScript patterns
interface WorkflowStep {
  id: string;                    // Always use string IDs
  type: WorkflowStepType;        // Always use enums/union types
  config: StepConfig;            // Always type configurations
  metadata?: StepMetadata;       // Optional fields marked with ?
}

// Never use 'any' - always create proper types
type StepConfig = {
  [K in WorkflowStepType]: {
    // Discriminated unions for type safety
    type: K;
    settings: StepSettings[K];
  };
}[WorkflowStepType];

// Always use proper error types
class WorkflowError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}
```

### Error Handling Patterns
```typescript
// ALWAYS use this error handling pattern
async function executeWorkflowStep(
  step: WorkflowStep,
  input: ProcessingInput
): Promise<ServiceResult<StepOutput>> {
  try {
    // Validate inputs first
    const validation = validateStepInput(step, input);
    if (!validation.isValid) {
      return {
        success: false,
        error: new ValidationError('Invalid step input', validation.errors)
      };
    }
    
    // Process with timeout
    const result = await Promise.race([
      processStep(step, input),
      timeoutPromise(STEP_TIMEOUT_MS)
    ]);
    
    // Validate outputs
    const outputValidation = validateStepOutput(result);
    if (!outputValidation.isValid) {
      throw new ProcessingError('Invalid step output', outputValidation.errors);
    }
    
    return { success: true, data: result };
    
  } catch (error) {
    // Log error with context
    logger.error('Workflow step execution failed', {
      stepId: step.id,
      stepType: step.type,
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: new WorkflowExecutionError(
        `Step ${step.type} failed: ${error.message}`,
        { stepId: step.id, originalError: error }
      )
    };
  }
}
```

### File Processing Security
```typescript
// ALWAYS validate files with this pattern
async function validateUploadedFile(
  file: Express.Multer.File
): Promise<ValidationResult> {
  const errors: string[] = [];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size ${file.size} exceeds limit ${MAX_FILE_SIZE}`);
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} not allowed`);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    errors.push(`File extension ${ext} not allowed`);
  }

  // Scan file content for malicious patterns
  const contentScan = await scanFileContent(file.buffer);
  if (!contentScan.isSafe) {
    errors.push('File contains potentially malicious content');
    // Log security event
    await logSecurityEvent('malicious_file_upload', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      threats: contentScan.threats
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## 4. Business Logic Constraints

### Usage Limits Enforcement
```typescript
// ALWAYS check usage limits before processing
async function checkUsageLimits(
  userId: string,
  operation: string
): Promise<UsageLimitResult> {
  const user = await getUserWithPlan(userId);
  const usage = await getCurrentUsage(userId);

  const limits = PLAN_LIMITS[user.planType];

  // Check operation count
  if (usage.operations >= limits.monthlyOperations) {
    return {
      allowed: false,
      reason: 'monthly_limit_exceeded',
      upgradeRequired: true,
      resetDate: getNextBillingDate(user)
    };
  }

  // Check file size limits
  if (operation === 'file_upload' && file.size > limits.maxFileSize) {
    return {
      allowed: false,
      reason: 'file_size_limit_exceeded',
      upgradeRequired: true,
      currentLimit: limits.maxFileSize
    };
  }

  return { allowed: true };
}

// ALWAYS increment usage after successful operations
async function recordUsage(userId: string, operation: string, metadata?: any) {
  await incrementUsageCounter(userId, operation);
  await logUsageEvent(userId, operation, metadata);
}
```

## 5. Performance Requirements

### Response Time Targets
```typescript
const PERFORMANCE_REQUIREMENTS = {
  api: {
    healthCheck: '< 100ms',
    authentication: '< 200ms',
    fileUpload: '< 500ms per MB',
    workflowExecution: '< 3000ms for 10MB file',
    userQueries: '< 300ms'
  },

  frontend: {
    pageLoad: '< 2000ms',
    componentRender: '< 100ms',
    userInteraction: '< 50ms response'
  }
};

// ALWAYS implement timeouts for external operations
async function processWithTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([operation, timeoutPromise]);
}
```

## 6. Security Requirements

### Input Validation
```typescript
// ALWAYS validate and sanitize ALL inputs
import { z } from 'zod';

const WorkflowCreateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid characters in name'),

  steps: z.array(z.object({
    type: z.enum(['split', 'merge', 'convert', 'compress']),
    config: z.record(z.any()).optional()
  })).min(1, 'At least one step required'),

  description: z.string().max(500).optional()
});

// Use validation in all API endpoints
app.post('/api/workflows', async (req, res) => {
  try {
    const validatedData = WorkflowCreateSchema.parse(req.body);
    // Process with validated data
  } catch (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
});
```

### Authentication Patterns
```typescript
// ALWAYS use proper authentication middleware
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await verifyAuthToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication failed', { error });
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// ALWAYS check permissions for resource access
const requireResourceAccess = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params.id;
    const userId = req.user.id;

    const hasAccess = await checkResourceAccess(userId, resourceType, resourceId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};
```

## 7. Environment & Configuration

### Environment Variables (NEVER Hardcode)
```typescript
// ALWAYS use environment variables for configuration
const CONFIG = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // External Services
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,

  // File Storage
  STORAGE_BUCKET: process.env.STORAGE_BUCKET!,
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB

  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 min
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100'),

  // Processing
  WORKFLOW_TIMEOUT: parseInt(process.env.WORKFLOW_TIMEOUT || '300000'), // 5 min

  // Security
  JWT_SECRET: process.env.JWT_SECRET!,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY!
};

// ALWAYS validate required environment variables on startup
function validateEnvironment() {
  const requiredVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'STRIPE_SECRET_KEY',
    'JWT_SECRET'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

## 8. Testing Requirements

### Test Coverage Requirements
```typescript
// ALWAYS write tests for new functions
describe('PDF Processing Service', () => {
  describe('splitPDF', () => {
    it('should split PDF correctly', async () => {
      // Test the happy path
      const result = await pdfService.splitPDF(testFile, ranges);
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
    });

    it('should handle invalid inputs gracefully', async () => {
      // Test error cases
      const result = await pdfService.splitPDF(null, ranges);
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
    });

    it('should enforce file size limits', async () => {
      // Test business logic
      const largeFile = createTestFile(200 * 1024 * 1024); // 200MB
      const result = await pdfService.splitPDF(largeFile, ranges);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('FILE_SIZE_LIMIT_EXCEEDED');
    });
  });
});

// ALWAYS test critical business logic
describe('Usage Limits', () => {
  it('should prevent free users from exceeding limits', async () => {
    const freeUser = await createTestUser('free');
    await useAllFreeOperations(freeUser.id);

    const result = await checkUsageLimits(freeUser.id, 'split');
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
  });
});
```

## 9. AI Prompt Templates

### Safe Prompt Templates
```markdown
# Template: Adding New Feature
"Add a new [FEATURE_NAME] feature to [FILE_PATH] following these requirements:

**Context**: [Provide full context about the feature]

**Existing Patterns**: [Show existing code patterns to follow]

**Requirements**:
- Must maintain all existing functionality
- Must include proper TypeScript types
- Must include error handling using our standard patterns
- Must include input validation
- Must include unit tests
- Must follow our security guidelines

**Example Usage**: [Show how the feature should be used]

**Integration Points**: [List what other parts of the system this connects to]

Generate the implementation following our established patterns."
```

```markdown
# Template: Bug Fix
"Fix the TypeScript error in [FUNCTION_NAME] without changing the function's behavior:

**Current Error**: [Paste exact error message]

**Function Context**: [Provide the function and surrounding code]

**Requirements**:
- Fix ONLY the TypeScript types, do not change logic
- Preserve all existing functionality
- Maintain backward compatibility
- Add proper type annotations

**Tests**: These tests must continue to pass: [List relevant tests]"
```

## 10. Final Checklist for AI Interactions

### Before Every AI Request:
```markdown
□ Provided full project context (tech stack, business model)
□ Included relevant existing code patterns
□ Specified what should NOT be changed
□ Listed security/business requirements
□ Mentioned performance requirements if applicable
□ Included test requirements
□ Specified error handling expectations
□ Made request specific and focused (not broad)
```

### After Every AI Response:
```markdown
□ Code follows TypeScript strict mode
□ All security validations preserved
□ Error handling included
□ No hardcoded values (uses env vars)
□ Performance requirements met
□ Tests included for new functionality
□ Documentation/comments added
□ Integration points considered
```

## 11. Critical Success Factors

### Code Quality Standards
- **TypeScript Strict Mode**: All code must pass strict type checking
- **Error Handling**: Every function must handle errors gracefully
- **Security First**: All inputs validated, all outputs sanitized
- **Performance Aware**: All operations must meet response time targets
- **Test Coverage**: All new code must include comprehensive tests

### Business Logic Integrity
- **Usage Limits**: Always enforce plan-based limitations
- **Payment Security**: Never compromise payment processing integrity
- **Data Protection**: Always encrypt sensitive data and validate access
- **Audit Trail**: Log all critical operations for compliance

This comprehensive briefing ensures your AI programmer understands the full context and constraints for building DocuSlicer successfully while avoiding common pitfalls that could derail the project.
