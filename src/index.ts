import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema';
import { createContext } from './graphql/context';
import { LocationAgent } from './agents/location-agent';
import { WeatherAgent } from './agents/weather-agent';
import { TravelAgent } from './agents/travel-agent';
import { AITravelAgent } from './agents/ai-travel-agent';

export interface Env {
  OPENWEATHER_API_KEY: string;
  IPGEOLOCATION_API_KEY: string;
  OPENAI_API_KEY: string;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
}

// Create Mastra agents
const locationAgent = new LocationAgent();
const weatherAgent = new WeatherAgent();
const travelAgent = new TravelAgent();
const aiTravelAgent = new AITravelAgent();

// Create GraphQL Yoga server
const yoga = createYoga({
  schema,
  context: (request) => createContext(request, {
    locationAgent,
    weatherAgent,
    travelAgent,
    aiTravelAgent,
  }),
  cors: {
    origin: '*',
    credentials: true,
  },
  // Enable GraphQL Playground in development
  graphiql: true,
});

// Cloudflare Workers fetch handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Add environment to context
      const contextWithEnv = {
        ...env,
        locationAgent,
        weatherAgent,
        travelAgent,
        aiTravelAgent,
      };

      // Handle GraphQL requests
      if (request.url.includes('/graphql') || request.method === 'POST') {
        return yoga.handleRequest(request, contextWithEnv);
      }

      // Health check endpoint
      if (request.url.includes('/health')) {
        const healthStatus = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT,
          services: {
            locationAgent: 'operational',
            weatherAgent: 'operational',
            travelAgent: 'operational',
            aiTravelAgent: env.OPENAI_API_KEY ? 'operational' : 'disabled (no API key)',
          },
          endpoints: {
            graphql: '/graphql',
            playground: '/',
            health: '/health',
          },
          apiKeys: {
            ipGeolocation: env.IPGEOLOCATION_API_KEY ? 'configured' : 'missing',
            openWeather: env.OPENWEATHER_API_KEY ? 'configured' : 'missing',
            openAI: env.OPENAI_API_KEY ? 'configured' : 'missing',
          }
        };

        return new Response(JSON.stringify(healthStatus, null, 2), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // API documentation endpoint
      if (request.url.includes('/docs')) {
        const docs = {
          title: 'Mastra Location Agent API',
          description: 'A comprehensive location-based services API with AI-powered travel planning',
          version: '1.0.0',
          endpoints: {
            graphql: {
              url: '/graphql',
              description: 'GraphQL API endpoint',
              methods: ['GET', 'POST'],
              features: [
                'Location services (IP geolocation)',
                'Weather information',
                'Travel planning',
                'AI-powered recommendations',
                'Workflow execution',
                'Real-time subscriptions'
              ]
            },
            playground: {
              url: '/',
              description: 'Interactive GraphQL Playground',
              method: 'GET'
            },
            health: {
              url: '/health',
              description: 'Health check and service status',
              method: 'GET'
            }
          },
          sampleQueries: {
            getCurrentLocation: `
query GetCurrentLocation {
  getCurrentLocation {
    city
    country
    latitude
    longitude
    timezone
  }
}`,
            getWeatherByIP: `
query GetWeatherByIP {
  getWeatherByIP {
    location
    temperature
    description
    humidity
    windSpeed
  }
}`,
            createAITravelPlan: `
mutation CreateAITravelPlan {
  createAITravelPlan(
    input: {
      destination: "Tokyo, Japan"
      startDate: "2024-09-01"
      endDate: "2024-09-07"
      travelers: 2
      interests: ["culture", "food", "technology"]
      travelStyle: "comfortable"
      useAI: true
    }
    userProfile: {
      interests: ["culture", "food", "technology"]
      travelStyle: "comfortable"
      budget: "$150-300 per day"
      groupSize: 2
    }
  ) {
    id
    destination
    aiRecommendations {
      destination
      description
      activities
      aiInsights
      personalizedTips
    }
    personalizedItinerary {
      generalTips
      budgetBreakdown {
        accommodation
        food
        activities
        transportation
      }
    }
  }
}`
          },
          aiFeatures: {
            enabled: env.OPENAI_API_KEY ? true : false,
            model: 'gpt-4o-mini',
            capabilities: [
              'Intelligent travel recommendations',
              'Personalized itinerary generation',
              'Cultural insights and local tips',
              'Budget optimization',
              'Seasonal travel advice'
            ]
          }
        };

        return new Response(JSON.stringify(docs, null, 2), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Default GraphQL playground for GET requests
      return yoga.handleRequest(request, contextWithEnv);
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
