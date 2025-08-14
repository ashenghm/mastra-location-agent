import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema';
import { createContext } from './graphql/context';
import { LocationAgent } from './agents/location-agent';
import { AILocationAgent } from './agents/ai-location-agent';

export interface Env {
  IPGEOLOCATION_API_KEY: string;
  OPENAI_API_KEY: string;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
}

// Create Mastra agents
const locationAgent = new LocationAgent();
const aiLocationAgent = new AILocationAgent();

// Create GraphQL Yoga server
const yoga = createYoga({
  schema,
  context: (request) => createContext(request, {
    locationAgent,
    aiLocationAgent,
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
        aiLocationAgent,
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
            aiLocationAgent: env.OPENAI_API_KEY ? 'operational' : 'disabled (no API key)',
          },
          endpoints: {
            graphql: '/graphql',
            playground: '/',
            health: '/health',
            docs: '/docs',
          },
          apiKeys: {
            ipGeolocation: env.IPGEOLOCATION_API_KEY ? 'configured' : 'missing',
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
          description: 'A comprehensive IP geolocation service with AI-powered location insights',
          version: '1.0.0',
          endpoints: {
            graphql: {
              url: '/graphql',
              description: 'GraphQL API endpoint',
              methods: ['GET', 'POST'],
              features: [
                'IP geolocation services',
                'AI-powered location insights',
                'Location-based recommendations',
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
            getLocationInsights: `
query GetLocationInsights {
  getLocationInsights(ip: "8.8.8.8") {
    location {
      city
      country
      latitude
      longitude
    }
    insights {
      demographics
      economy
      culture
      attractions
      climate
      livingCosts
      safetyInfo
      localTips
    }
    nearbyPlaces {
      name
      type
      distance
      description
    }
  }
}`,
            executeLocationWorkflow: `
mutation ExecuteLocationWorkflow {
  executeLocationWorkflow(ip: "8.8.8.8") {
    id
    status
    steps {
      name
      status
      output
    }
    result
  }
}`
          },
          aiFeatures: {
            enabled: env.OPENAI_API_KEY ? true : false,
            model: 'gpt-4o-mini',
            capabilities: [
              'Location-based insights and analysis',
              'Cultural and demographic information',
              'Local attractions and recommendations',
              'Safety and living cost information',
              'Climate and weather patterns'
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
