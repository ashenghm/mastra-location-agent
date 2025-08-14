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

  // AI Travel planning workflow: IP/Destination -> Location -> Weather -> AI Travel Plan
  async executeAITravelPlanningWorkflow({
    ip,
    destination,
    startDate,
    endDate,
    userProfile
  }: {
    ip?: string;
    destination?: string;
    startDate: string;
    endDate: string;
    userProfile: any;
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

      // Step 3: Generate AI travel recommendations
      const aiRecommendationsStep = await this.executeStep(
        'Generate AI Travel Recommendations',
        async () => {
          if (!this.context.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
          }
          if (!this.context.aiTravelAgent) {
            throw new Error('AI Travel Agent not available');
          }

          const targetDestination = destination || (locationData ? `${locationData.city}, ${locationData.country}` : 'Unknown Destination');
          const recommendations = await this.context.aiTravelAgent.getAIRecommendations(
            targetDestination,
            userProfile.interests || ['culture', 'food', 'nature'],
            userProfile.travelStyle,
            userProfile.budget,
            this.calculateDuration(startDate, endDate),
            this.context.OPENAI_API_KEY
          );
          return JSON.stringify(recommendations);
        },
        JSON.stringify({ destination, userProfile: userProfile.interests })
      );
      execution.steps.push(aiRecommendationsStep);

      // Step 4: Generate personalized itinerary
      const personalizedItineraryStep = await this.executeStep(
        'Generate Personalized Itinerary',
        async () => {
          if (!this.context.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
          }
          if (!this.context.aiTravelAgent) {
            throw new Error('AI Travel Agent not available');
          }

          const targetDestination = destination || (locationData ? `${locationData.city}, ${locationData.country}` : 'Unknown Destination');
          const itinerary = await this.context.aiTravelAgent.createPersonalizedItinerary(
            targetDestination,
            startDate,
            endDate,
            userProfile,
            this.context.OPENAI_API_KEY
          );
          return JSON.stringify(itinerary);
        },
        JSON.stringify({ destination, startDate, endDate, userProfile })
      );
      execution.steps.push(personalizedItineraryStep);

      // Step 5: Generate travel insights
      const insightsStep = await this.executeStep(
        'Generate Travel Insights',
        async () => {
          if (!this.context.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
          }
          if (!this.context.aiTravelAgent) {
            throw new Error('AI Travel Agent not available');
          }

          const targetDestination = destination || (locationData ? `${locationData.city}, ${locationData.country}` : 'Unknown Destination');
          const currentSeason = new Date().toLocaleDateString('en-US', { month: 'long' });
          const insights = await this.context.aiTravelAgent.getDestinationInsights(
            targetDestination,
            currentSeason,
            userProfile.interests || ['culture', 'food', 'nature'],
            this.context.OPENAI_API_KEY
          );
          return JSON.stringify(insights);
        },
        JSON.stringify({ destination, userProfile: userProfile.interests })
      );
      execution.steps.push(insightsStep);

      // Step 6: Create comprehensive AI travel plan
      const aiTravelPlanStep = await this.executeStep(
        'Create AI Travel Plan',
        async () => {
          const planInput = {
            destination: destination || (locationData ? `${locationData.city}, ${locationData.country}` : 'Unknown Destination'),
            startDate,
            endDate,
            travelers: userProfile.groupSize || 1,
            interests: userProfile.interests || ['culture', 'food', 'nature'],
            budget: userProfile.budget || '$100-200 per day',
            travelStyle: userProfile.travelStyle || 'balanced',
            useAI: true
          };

          // Create base travel plan
          const basePlan = await this.context.travelAgent.createPlan(planInput);
          
          // Enhance with AI data
          const aiRecommendations = JSON.parse(aiRecommendationsStep.output || '[]');
          const personalizedItinerary = JSON.parse(personalizedItineraryStep.output || '{}');
          const travelInsights = JSON.parse(insightsStep.output || '{}');

          const enhancedPlan = {
            ...basePlan,
            aiRecommendations,
            personalizedItinerary,
            travelInsights,
          };

          return JSON.stringify(enhancedPlan);
        },
        JSON.stringify({ destination, startDate, endDate, userProfile })
      );
      execution.steps.push(aiTravelPlanStep);

      if (aiTravelPlanStep.status === 'completed') {
        execution.status = 'completed';
        execution.result = aiTravelPlanStep.output;
      } else {
        execution.status = 'failed';
        execution.error = aiTravelPlanStep.error;
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

  // Calculate duration between dates
  private calculateDuration(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days > 1 ? 's' : ''}`;
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
