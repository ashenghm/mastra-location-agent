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

  // Location workflow: IP -> Location
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

  // Weather workflow: IP -> Location -> Weather
  async executeWeatherWorkflow(ip: string): Promise<WorkflowExecution> {
    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      status: 'running',
      steps: [],
      startedAt: new Date().toISOString(),
    };

    try {
      // Step 1: Get location from IP
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

      // Step 2: Get weather for location
      const weatherStep = await this.executeStep(
        'Get Weather for Location',
        async () => {
          if (!this.context.OPENWEATHER_API_KEY) {
            throw new Error('Weather API key not configured');
          }
          
          const location = JSON.parse(locationStep.output!);
          const weather = await this.context.weatherAgent.getWeather(
            location.latitude, 
            location.longitude, 
            this.context.OPENWEATHER_API_KEY
          );
          return JSON.stringify(weather);
        },
        locationStep.output || ''
      );
      execution.steps.push(weatherStep);

      if (weatherStep.status === 'completed') {
        execution.status = 'completed';
        execution.result = weatherStep.output;
      } else {
        execution.status = 'failed';
        execution.error = weatherStep.error;
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

  // Travel planning workflow: IP/Destination -> Location -> Weather -> Travel Plan
  async executeTravelPlanningWorkflow({
    ip,
    destination,
    startDate,
    endDate
  }: {
    ip?: string;
    destination?: string;
    startDate: string;
    endDate: string;
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

      // Step 1: Determine location (from IP or use destination)
      if (ip) {
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
      }

      // Step 2: Get weather forecast for destination
      const weatherStep = await this.executeStep(
        'Get Weather Forecast',
        async () => {
          if (!this.context.OPENWEATHER_API_KEY) {
            throw new Error('Weather API key not configured');
          }

          let weather;
          if (locationData) {
            weather = await this.context.weatherAgent.getWeather(
              locationData.latitude,
              locationData.longitude,
              this.context.OPENWEATHER_API_KEY
            );
          } else if (destination) {
            weather = await this.context.weatherAgent.getWeatherByCityName(
              destination,
              undefined,
              this.context.OPENWEATHER_API_KEY
            );
          } else {
            throw new Error('No location data available for weather forecast');
          }
          
          return JSON.stringify(weather);
        },
        destination || (locationData ? `${locationData.city}, ${locationData.country}` : 'Unknown')
      );
      execution.steps.push(weatherStep);

      // Step 3: Generate travel recommendations
      const recommendationsStep = await this.executeStep(
        'Generate Travel Recommendations',
        async () => {
          const lat = locationData?.latitude || 0;
          const lng = locationData?.longitude || 0;
          const interests = ['culture', 'food', 'nature']; // Default interests
          
          const recommendations = await this.context.travelAgent.getRecommendations(
            lat, lng, interests
          );
          return JSON.stringify(recommendations);
        },
        'Default interests: culture, food, nature'
      );
      execution.steps.push(recommendationsStep);

      // Step 4: Create travel plan
      const travelPlanStep = await this.executeStep(
        'Create Travel Plan',
        async () => {
          const planInput = {
            destination: destination || (locationData ? `${locationData.city}, ${locationData.country}` : 'Unknown Destination'),
            startDate,
            endDate,
            travelers: 1,
            interests: ['culture', 'food', 'nature'],
            budget: '$100-200 per day',
            travelStyle: 'balanced'
          };

          const travelPlan = await this.context.travelAgent.createPlan(planInput);
          return JSON.stringify(travelPlan);
        },
        JSON.stringify({ destination, startDate, endDate })
      );
      execution.steps.push(travelPlanStep);

      if (travelPlanStep.status === 'completed') {
        execution.status = 'completed';
        execution.result = travelPlanStep.output;
      } else {
        execution.status = 'failed';
        execution.error = travelPlanStep.error;
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
