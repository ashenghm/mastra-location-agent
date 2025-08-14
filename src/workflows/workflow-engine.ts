import { Workflow, WorkflowStep } from '@mastra/engine';
import { GraphQLContext } from '../graphql/context';
import { z } from 'zod';

// Workflow execution schemas
const WorkflowStepSchema = z.object({
  name: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  input: z.string().optional(),
  output: z.string().optional(),
  error: z.string().optional(),
  duration: z.number().optional(),
});

const WorkflowExecutionSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  steps: z.array(WorkflowStepSchema),
  result: z.string().optional(),
  error: z.string().optional(),
  startedAt: z.string(),
  completedAt: z.string().optional(),
});

export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;
export type WorkflowStepType = z.infer<typeof WorkflowStepSchema>;

export class WorkflowEngine {
  private context: GraphQLContext;
  private executions: Map<string, WorkflowExecution> = new Map();

  constructor(context: GraphQLContext) {
    this.context = context;
  }

  // Basic location workflow: IP -> Location
  async executeLocationWorkflow(ip: string): Promise<WorkflowExecution> {
    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      status: 'running',
      steps: [],
      startedAt: new Date().toISOString(),
    };

    try {
      // Step 1: Validate IP
      const validateStep = await this.executeStep(
        'Validate IP Address',
        async () => {
          const isValid = await this.context.locationAgent.isValidAddress(ip);
          if (!isValid) {
            throw new Error(`Invalid IP address: ${ip}`);
          }
          return `IP ${ip} is valid`;
        },
        ip
      );
      execution.steps.push(validateStep);

      if (validateStep.status === 'failed') {
        execution.status = 'failed';
        execution.error = validateStep.error;
        execution.completedAt = new Date().toISOString();
        this.executions.set(executionId, execution);
        return execution;
      }

      // Step 2: Get location from IP
      const locationStep = await this.executeStep(
        'Get Location from IP',
        async () => {
          if (!this.context.IPGEOLOCATION_API_KEY) {
            throw new Error('IP geolocation API key not configured');
          }
          const location = await this.context.locationAgent.getLocation(ip, this.context.IPGEOLOCATION_API_KEY);
          return JSON.stringify(location);
        },
        `IP: ${ip}`
      );
      execution.steps.push(locationStep);

      if (locationStep.status === 'completed') {
        execution.status = 'completed';
        execution.result = locationStep.output;
      } else {
        execution.status = 'failed';
        execution.error = locationStep.error;
      }

      execution.completedAt = new Date().toISOString();
      this.executions.set(executionId, execution);
      return execution;

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date().toISOString();
      this.executions.set(executionId, execution);
      return execution;
    }
  }

  // Enhanced location analysis workflow: IP/Location -> Location -> AI Analysis
  async executeLocationAnalysisWorkflow({
    ip,
    city,
    country,
    purpose = 'general'
  }: {
    ip?: string;
    city?: string;
    country?: string;
    purpose?: string;
  }): Promise<WorkflowExecution> {
    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      status: 'running',
      steps: [],
      startedAt: new Date().toISOString(),
    };

    try {
      let locationData: any = null;

      // Step 1: Determine location (from IP or use provided city/country)
      if (ip && (!city || !country)) {
        const locationStep = await this.executeStep(
          'Get Location from IP',
          async () => {
            if (!this.context.IPGEOLOCATION_API_KEY) {
              throw new Error('IP geolocation API key not configured');
            }
            const location = await this.context.locationAgent.getLocation(ip, this.context.IPGEOLOCATION_API_KEY);
            return JSON.stringify(location);
          },
          `IP: ${ip}`
        );
        execution.steps.push(locationStep);

        if (locationStep.status === 'failed') {
          execution.status = 'failed';
          execution.error = locationStep.error;
          execution.completedAt = new Date().toISOString();
          this.executions.set(executionId, execution);
          return execution;
        }

        locationData = JSON.parse(locationStep.output!);
      } else if (city && country) {
        locationData = {
          city,
          country,
          region: '',
          latitude: 0,
          longitude: 0
        };
      } else {
        execution.status = 'failed';
        execution.error = 'Either IP address or city/country must be provided';
        execution.completedAt = new Date().toISOString();
        this.executions.set(executionId, execution);
        return execution;
      }

      // Step 2: Generate AI location insights
      const insightsStep = await this.executeStep(
        'Generate Location Insights',
        async () => {
          if (!this.context.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
          }

          const insights = await this.context.aiLocationAgent.getLocationInsights(
            locationData.city,
            locationData.country,
            locationData.region,
            locationData.latitude || 0,
            locationData.longitude || 0,
            purpose as any,
            this.context.OPENAI_API_KEY
          );
          return JSON.stringify(insights);
        },
        JSON.stringify({ location: locationData, purpose })
      );
      execution.steps.push(insightsStep);

      // Step 3: Generate risk analysis
      const riskStep = await this.executeStep(
        'Analyze Location Risks',
        async () => {
          if (!this.context.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
          }

          const riskAnalysis = await this.context.aiLocationAgent.getRiskAnalysis(
            locationData.city,
            locationData.country,
            this.context.OPENAI_API_KEY
          );
          return JSON.stringify(riskAnalysis);
        },
        `Location: ${locationData.city}, ${locationData.country}`
      );
      execution.steps.push(riskStep);

      // Step 4: Find nearby places
      const nearbyStep = await this.executeStep(
        'Find Nearby Places',
        async () => {
          if (!this.context.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
          }

          const nearbyPlaces = await this.context.aiLocationAgent.getNearbyPlaces(
            locationData.city,
            locationData.country,
            '50km',
            ['attractions', 'cities', 'natural sites'],
            this.context.OPENAI_API_KEY
          );
          return JSON.stringify(nearbyPlaces);
        },
        `Location: ${locationData.city}, ${locationData.country}, Radius: 50km`
      );
      execution.steps.push(nearbyStep);

      // Step 5: Compile comprehensive analysis
      const analysisStep = await this.executeStep(
        'Compile Comprehensive Analysis',
        async () => {
          const insights = JSON.parse(insightsStep.output || '{}');
          const riskAnalysis = JSON.parse(riskStep.output || '{}');
          const nearbyPlaces = JSON.parse(nearbyStep.output || '[]');

          const comprehensiveAnalysis = {
            location: locationData,
            insights: insights.insights || {},
            riskAssessment: insights.riskAssessment || riskAnalysis,
            nearbyPlaces: insights.nearbyPlaces || nearbyPlaces,
            recommendations: insights.recommendations || [],
            analysisDate: new Date().toISOString(),
            purpose,
          };

          return JSON.stringify(comprehensiveAnalysis);
        },
        'Compiling all analysis results'
      );
      execution.steps.push(analysisStep);

      if (analysisStep.status === 'completed') {
        execution.status = 'completed';
        execution.result = analysisStep.output;
      } else {
        execution.status = 'failed';
        execution.error = analysisStep.error;
      }

      execution.completedAt = new Date().toISOString();
      this.executions.set(executionId, execution);
      return execution;

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date().toISOString();
      this.executions.set(executionId, execution);
      return execution;
    }
  }

  // Execute a single workflow step
  private async executeStep(
    name: string,
    operation: () => Promise<string>,
    input?: string
  ): Promise<WorkflowStepType> {
    const step: WorkflowStepType = {
      name,
      status: 'running',
      input,
    };

    const startTime = Date.now();

    try {
      step.output = await operation();
      step.status = 'completed';
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      step.duration = Date.now() - startTime;
    }

    return step;
  }

  // Get workflow execution by ID
  async getExecution(id: string): Promise<WorkflowExecution | null> {
    return this.executions.get(id) || null;
  }

  // Generate unique execution ID
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get all executions (for debugging/monitoring)
  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  // Clear completed executions (for memory management)
  clearCompletedExecutions(): void {
    for (const [id, execution] of this.executions.entries()) {
      if (execution.status === 'completed' || execution.status === 'failed') {
        this.executions.delete(id);
      }
    }
  }
}
