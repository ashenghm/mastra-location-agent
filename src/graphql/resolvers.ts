import { GraphQLContext } from './context';
import { WorkflowEngine } from '../workflows/workflow-engine';

export const resolvers = {
  Query: {
    // Basic location queries
    async getLocationFromIP(parent: any, { ip }: { ip: string }, context: GraphQLContext) {
      try {
        if (!context.IPGEOLOCATION_API_KEY) {
          throw new Error('IP geolocation API key not configured');
        }
        return await context.locationAgent.getLocation(ip, context.IPGEOLOCATION_API_KEY);
      } catch (error) {
        console.error('Error getting location from IP:', error);
        throw new Error(`Failed to get location: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async getCurrentLocation(parent: any, args: any, context: GraphQLContext) {
      try {
        if (!context.IPGEOLOCATION_API_KEY || !context.clientIP) {
          throw new Error('Unable to determine current location');
        }
        return await context.locationAgent.getLocation(context.clientIP, context.IPGEOLOCATION_API_KEY);
      } catch (error) {
        console.error('Error getting current location:', error);
        throw new Error(`Failed to get current location: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // AI-powered location analysis
    async getLocationInsights(
      parent: any,
      { ip, city, country, purpose = 'general' }: {
        ip?: string;
        city?: string;
        country?: string;
        purpose?: string;
      },
      context: GraphQLContext
    ) {
      try {
        if (!context.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }

        let targetCity = city;
        let targetCountry = country;
        let region: string | undefined;
        let latitude = 0;
        let longitude = 0;

        // If IP is provided, get location first
        if (ip && (!city || !country)) {
          if (!context.IPGEOLOCATION_API_KEY) {
            throw new Error('IP geolocation API key not configured');
          }
          
          const location = await context.locationAgent.getLocation(ip, context.IPGEOLOCATION_API_KEY);
          targetCity = location.city;
          targetCountry = location.country;
          region = location.region;
          latitude = location.latitude;
          longitude = location.longitude;
        }

        if (!targetCity || !targetCountry) {
          throw new Error('City and country must be provided or determinable from IP');
        }

        return await context.aiLocationAgent.getLocationInsights(
          targetCity,
          targetCountry,
          region,
          latitude,
          longitude,
          purpose as any,
          context.OPENAI_API_KEY
        );
      } catch (error) {
        console.error('Error getting location insights:', error);
        throw new Error(`Failed to get location insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async getRiskAnalysis(
      parent: any,
      { city, country }: { city: string; country: string },
      context: GraphQLContext
    ) {
      try {
        if (!context.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }

        const riskAnalysis = await context.aiLocationAgent.getRiskAnalysis(
          city,
          country,
          context.OPENAI_API_KEY
        );

        return JSON.stringify(riskAnalysis, null, 2);
      } catch (error) {
        console.error('Error getting risk analysis:', error);
        throw new Error(`Failed to get risk analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async getNearbyPlaces(
      parent: any,
      { city, country, radius, categories }: {
        city: string;
        country: string;
        radius?: string;
        categories?: string[];
      },
      context: GraphQLContext
    ) {
      try {
        if (!context.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }

        return await context.aiLocationAgent.getNearbyPlaces(
          city,
          country,
          radius,
          categories,
          context.OPENAI_API_KEY
        );
      } catch (error) {
        console.error('Error getting nearby places:', error);
        throw new Error(`Failed to get nearby places: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async compareLocations(
      parent: any,
      { locations, criteria }: {
        locations: Array<{ city: string; country: string }>;
        criteria?: string[];
      },
      context: GraphQLContext
    ) {
      try {
        if (!context.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }

        return await context.aiLocationAgent.compareLocations(
          locations,
          criteria,
          context.OPENAI_API_KEY
        );
      } catch (error) {
        console.error('Error comparing locations:', error);
        throw new Error(`Failed to compare locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // Workflow queries
    async getWorkflowExecution(parent: any, { id }: { id: string }, context: GraphQLContext) {
      try {
        const workflowEngine = new WorkflowEngine(context);
        return await workflowEngine.getExecution(id);
      } catch (error) {
        console.error('Error getting workflow execution:', error);
        throw new Error(`Failed to get workflow execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },

  Mutation: {
    // Workflow mutations
    async executeLocationWorkflow(parent: any, { ip }: { ip: string }, context: GraphQLContext) {
      try {
        const workflowEngine = new WorkflowEngine(context);
        return await workflowEngine.executeLocationWorkflow(ip);
      } catch (error) {
        console.error('Error executing location workflow:', error);
        throw new Error(`Failed to execute location workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async executeLocationAnalysisWorkflow(
      parent: any,
      { ip, city, country, purpose = 'general' }: {
        ip?: string;
        city?: string;
        country?: string;
        purpose?: string;
      },
      context: GraphQLContext
    ) {
      try {
        const workflowEngine = new WorkflowEngine(context);
        return await workflowEngine.executeLocationAnalysisWorkflow({
          ip,
          city,
          country,
          purpose,
        });
      } catch (error) {
        console.error('Error executing location analysis workflow:', error);
        throw new Error(`Failed to execute location analysis workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },

  // Subscription resolvers
  Subscription: {
    workflowUpdates: {
      subscribe: async function* (parent: any, { workflowId }: { workflowId: string }, context: GraphQLContext) {
        try {
          const workflowEngine = new WorkflowEngine(context);
          let lastUpdate = Date.now();
          
          while (true) {
            // Poll for updates every 2 seconds
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            try {
              const execution = await workflowEngine.getExecution(workflowId);
              if (execution && execution.completedAt && new Date(execution.completedAt).getTime() > lastUpdate) {
                lastUpdate = new Date(execution.completedAt).getTime();
                yield { workflowUpdates: execution };
              }
            } catch (error) {
              console.error('Error polling workflow updates:', error);
              // Continue polling even if there's an error
            }

            // Stop polling if workflow is completed or failed
            const execution = await workflowEngine.getExecution(workflowId);
            if (execution && (execution.status === 'completed' || execution.status === 'failed')) {
              break;
            }
          }
        } catch (error) {
          console.error('Error in workflow subscription:', error);
          throw new Error(`Failed to subscribe to workflow updates: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      },
    },
  },
};
