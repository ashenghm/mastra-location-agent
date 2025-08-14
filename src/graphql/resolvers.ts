import { GraphQLContext } from './context';
import { WorkflowEngine } from '../workflows/workflow-engine';

export const resolvers = {
  Query: {
    // Location queries
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

    // Weather queries
    async getWeatherByCoordinates(
      parent: any, 
      { latitude, longitude }: { latitude: number; longitude: number }, 
      context: GraphQLContext
    ) {
      try {
        if (!context.OPENWEATHER_API_KEY) {
          throw new Error('Weather API key not configured');
        }
        return await context.weatherAgent.getWeather(latitude, longitude, context.OPENWEATHER_API_KEY);
      } catch (error) {
        console.error('Error getting weather by coordinates:', error);
        throw new Error(`Failed to get weather: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async getWeatherByCity(
      parent: any, 
      { city, country }: { city: string; country?: string }, 
      context: GraphQLContext
    ) {
      try {
        if (!context.OPENWEATHER_API_KEY) {
          throw new Error('Weather API key not configured');
        }
        return await context.weatherAgent.getWeatherByCityName(city, country, context.OPENWEATHER_API_KEY);
      } catch (error) {
        console.error('Error getting weather by city:', error);
        throw new Error(`Failed to get weather: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async getWeatherByIP(parent: any, { ip }: { ip?: string }, context: GraphQLContext) {
      try {
        if (!context.OPENWEATHER_API_KEY || !context.IPGEOLOCATION_API_KEY) {
          throw new Error('Required API keys not configured');
        }

        const targetIP = ip || context.clientIP;
        if (!targetIP) {
          throw new Error('No IP address available');
        }

        // Get location first
        const location = await context.locationAgent.getLocation(targetIP, context.IPGEOLOCATION_API_KEY);
        
        // Then get weather for that location
        return await context.weatherAgent.getWeather(
          location.latitude, 
          location.longitude, 
          context.OPENWEATHER_API_KEY
        );
      } catch (error) {
        console.error('Error getting weather by IP:', error);
        throw new Error(`Failed to get weather: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // Travel queries
    async getTravelRecommendations(
      parent: any, 
      { latitude, longitude, interests }: { latitude: number; longitude: number; interests: string[] }, 
      context: GraphQLContext
    ) {
      try {
        return await context.travelAgent.getRecommendations(latitude, longitude, interests);
      } catch (error) {
        console.error('Error getting travel recommendations:', error);
        throw new Error(`Failed to get recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async getTravelPlan(parent: any, { id }: { id: string }, context: GraphQLContext) {
      try {
        const plan = await context.travelAgent.getTravelPlan(id);
        if (!plan) {
          throw new Error(`Travel plan with ID ${id} not found`);
        }
        return plan;
      } catch (error) {
        console.error('Error getting travel plan:', error);
        throw new Error(`Failed to get travel plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async getAllTravelPlans(parent: any, args: any, context: GraphQLContext) {
      try {
        return await context.travelAgent.getAllTravelPlans();
      } catch (error) {
        console.error('Error getting all travel plans:', error);
        throw new Error(`Failed to get travel plans: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // AI-powered travel queries
    async getAITravelRecommendations(
      parent: any,
      { location, interests, travelStyle, budget, duration }: {
        location: string;
        interests: string[];
        travelStyle?: string;
        budget?: string;
        duration?: string;
      },
      context: GraphQLContext
    ) {
      try {
        if (!context.aiTravelAgent) {
          throw new Error('AI Travel Agent not available');
        }
        if (!context.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }

        return await context.aiTravelAgent.getAIRecommendations(
          location,
          interests,
          travelStyle,
          budget,
          duration,
          context.OPENAI_API_KEY
        );
      } catch (error) {
        console.error('Error getting AI travel recommendations:', error);
        throw new Error(`Failed to get AI recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async getTravelInsights(
      parent: any,
      { destination, currentSeason, userInterests }: {
        destination: string;
        currentSeason: string;
        userInterests: string[];
      },
      context: GraphQLContext
    ) {
      try {
        if (!context.aiTravelAgent) {
          throw new Error('AI Travel Agent not available');
        }
        if (!context.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }

        return await context.aiTravelAgent.getDestinationInsights(
          destination,
          currentSeason,
          userInterests,
          context.OPENAI_API_KEY
        );
      } catch (error) {
        console.error('Error getting travel insights:', error);
        throw new Error(`Failed to get travel insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async generatePersonalizedItinerary(
      parent: any,
      { destination, startDate, endDate, userProfile }: {
        destination: string;
        startDate: string;
        endDate: string;
        userProfile: any;
      },
      context: GraphQLContext
    ) {
      try {
        if (!context.aiTravelAgent) {
          throw new Error('AI Travel Agent not available');
        }
        if (!context.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }

        return await context.aiTravelAgent.createPersonalizedItinerary(
          destination,
          startDate,
          endDate,
          userProfile,
          context.OPENAI_API_KEY
        );
      } catch (error) {
        console.error('Error generating personalized itinerary:', error);
        throw new Error(`Failed to generate personalized itinerary: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    // Travel mutations
    async createTravelPlan(parent: any, { input }: { input: any }, context: GraphQLContext) {
      try {
        return await context.travelAgent.createPlan(input);
      } catch (error) {
        console.error('Error creating travel plan:', error);
        throw new Error(`Failed to create travel plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async updateTravelPlan(parent: any, { id, input }: { id: string; input: any }, context: GraphQLContext) {
      try {
        const updatedPlan = await context.travelAgent.updateTravelPlan(id, input);
        if (!updatedPlan) {
          throw new Error(`Travel plan with ID ${id} not found`);
        }
        return updatedPlan;
      } catch (error) {
        console.error('Error updating travel plan:', error);
        throw new Error(`Failed to update travel plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async deleteTravelPlan(parent: any, { id }: { id: string }, context: GraphQLContext) {
      try {
        const deleted = await context.travelAgent.deleteTravelPlan(id);
        if (!deleted) {
          throw new Error(`Travel plan with ID ${id} not found`);
        }
        return true;
      } catch (error) {
        console.error('Error deleting travel plan:', error);
        throw new Error(`Failed to delete travel plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // AI-enhanced travel mutations
    async createAITravelPlan(
      parent: any,
      { input, userProfile }: { input: any; userProfile: any },
      context: GraphQLContext
    ) {
      try {
        if (!context.aiTravelAgent) {
          throw new Error('AI Travel Agent not available');
        }
        if (!context.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }

        // Create base travel plan
        const basePlan = await context.travelAgent.createPlan(input);

        // Enhance with AI if requested
        if (input.useAI) {
          try {
            // Get AI recommendations
            const aiRecommendations = await context.aiTravelAgent.getAIRecommendations(
              input.destination,
              input.interests || [],
              input.travelStyle,
              input.budget,
              undefined,
              context.OPENAI_API_KEY
            );

            // Get personalized itinerary
            const personalizedItinerary = await context.aiTravelAgent.createPersonalizedItinerary(
              input.destination,
              input.startDate,
              input.endDate,
              userProfile,
              context.OPENAI_API_KEY
            );

            // Get travel insights
            const currentSeason = new Date().toLocaleDateString('en-US', { month: 'long' });
            const travelInsights = await context.aiTravelAgent.getDestinationInsights(
              input.destination,
              currentSeason,
              input.interests || [],
              context.OPENAI_API_KEY
            );

            // Merge AI enhancements with base plan
            return {
              ...basePlan,
              aiRecommendations,
              personalizedItinerary,
              travelInsights,
            };
          } catch (aiError) {
            console.warn('AI enhancement failed, returning base plan:', aiError);
            return basePlan;
          }
        }

        return basePlan;
      } catch (error) {
        console.error('Error creating AI travel plan:', error);
        throw new Error(`Failed to create AI travel plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

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

    async executeWeatherWorkflow(parent: any, { ip }: { ip?: string }, context: GraphQLContext) {
      try {
        const workflowEngine = new WorkflowEngine(context);
        const targetIP = ip || context.clientIP;
        if (!targetIP) {
          throw new Error('No IP address available for weather workflow');
        }
        return await workflowEngine.executeWeatherWorkflow(targetIP);
      } catch (error) {
        console.error('Error executing weather workflow:', error);
        throw new Error(`Failed to execute weather workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async executeTravelPlanningWorkflow(
      parent: any, 
      { ip, destination, startDate, endDate }: { 
        ip?: string; 
        destination?: string; 
        startDate: string; 
        endDate: string; 
      }, 
      context: GraphQLContext
    ) {
      try {
        const workflowEngine = new WorkflowEngine(context);
        const targetIP = ip || context.clientIP;
        
        if (!targetIP && !destination) {
          throw new Error('Either IP address or destination must be provided');
        }

        return await workflowEngine.executeTravelPlanningWorkflow({
          ip: targetIP,
          destination,
          startDate,
          endDate,
        });
      } catch (error) {
        console.error('Error executing travel planning workflow:', error);
        throw new Error(`Failed to execute travel planning workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async executeAITravelPlanningWorkflow(
      parent: any,
      { ip, destination, startDate, endDate, userProfile }: {
        ip?: string;
        destination?: string;
        startDate: string;
        endDate: string;
        userProfile: any;
      },
      context: GraphQLContext
    ) {
      try {
        if (!context.aiTravelAgent) {
          throw new Error('AI Travel Agent not available');
        }
        if (!context.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }

        const workflowEngine = new WorkflowEngine(context);
        const targetIP = ip || context.clientIP;
        
        if (!targetIP && !destination) {
          throw new Error('Either IP address or destination must be provided');
        }

        return await workflowEngine.executeAITravelPlanningWorkflow({
          ip: targetIP,
          destination,
          startDate,
          endDate,
          userProfile,
        });
      } catch (error) {
        console.error('Error executing AI travel planning workflow:', error);
        throw new Error(`Failed to execute AI travel planning workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },

  // Subscription resolvers (basic implementation for workflow updates)
  Subscription: {
    workflowUpdates: {
      subscribe: async function* (parent: any, { workflowId }: { workflowId: string }, context: GraphQLContext) {
        // This is a simplified implementation
        // In a real application, you'd use a pub/sub system like Redis or WebSockets
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
