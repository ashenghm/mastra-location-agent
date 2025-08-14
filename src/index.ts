import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema';
import { createContext } from './graphql/context';
import { LocationAgent } from './agents/location-agent';
import { WeatherAgent } from './agents/weather-agent';
import { TravelAgent } from './agents/travel-agent';

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

// Create GraphQL Yoga server
const yoga = createYoga({
  schema,
  context: (request) => createContext(request, {
    locationAgent,
    weatherAgent,
    travelAgent,
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
      };

      // Handle GraphQL requests
      if (request.url.includes('/graphql') || request.method === 'POST') {
        return yoga.handleRequest(request, contextWithEnv);
      }

      // Health check endpoint
      if (request.url.includes('/health')) {
        return new Response(JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT 
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Default GraphQL playground for GET requests
      return yoga.handleRequest(request, contextWithEnv);
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
