import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './resolvers';

const typeDefs = `
  type Location {
    ip: String!
    country: String!
    region: String!
    city: String!
    latitude: Float!
    longitude: Float!
    timezone: String!
    isp: String
  }

  type Weather {
    location: String!
    temperature: Float!
    description: String!
    humidity: Int!
    windSpeed: Float!
    windDirection: Int!
    pressure: Float!
    uvIndex: Float
    visibility: Float
    icon: String!
    lastUpdated: String!
  }

  type TravelRecommendation {
    destination: String!
    description: String!
    activities: [String!]!
    bestTimeToVisit: String!
    estimatedBudget: String!
    transportationOptions: [String!]!
    accommodationSuggestions: [String!]!
    duration: String!
  }

  type TravelPlan {
    id: String!
    destination: String!
    startDate: String!
    endDate: String!
    itinerary: [ItineraryItem!]!
    totalBudget: String!
    weatherForecast: [WeatherForecast!]!
    recommendations: [TravelRecommendation!]!
    createdAt: String!
  }

  type ItineraryItem {
    day: Int!
    date: String!
    activities: [Activity!]!
    meals: [Meal!]!
    accommodation: String
  }

  type Activity {
    time: String!
    name: String!
    description: String!
    location: String!
    estimatedCost: String
    duration: String!
  }

  type Meal {
    time: String!
    type: String!
    restaurant: String!
    cuisine: String!
    estimatedCost: String
  }

  type WeatherForecast {
    date: String!
    maxTemp: Float!
    minTemp: Float!
    description: String!
    icon: String!
    precipitation: Float!
  }

  type WorkflowExecution {
    id: String!
    status: String!
    steps: [WorkflowStep!]!
    result: String
    error: String
    startedAt: String!
    completedAt: String
  }

  type WorkflowStep {
    name: String!
    status: String!
    input: String
    output: String
    error: String
    duration: Int
  }

  input TravelPlanInput {
    destination: String!
    startDate: String!
    endDate: String!
    budget: String
    travelers: Int!
    interests: [String!]
    travelStyle: String
  }

  type Query {
    # Location queries
    getLocationFromIP(ip: String!): Location
    getCurrentLocation: Location

    # Weather queries
    getWeatherByCoordinates(latitude: Float!, longitude: Float!): Weather
    getWeatherByCity(city: String!, country: String): Weather
    getWeatherByIP(ip: String): Weather

    # Travel queries
    getTravelRecommendations(latitude: Float!, longitude: Float!, interests: [String!]): [TravelRecommendation!]!
    getTravelPlan(id: String!): TravelPlan
    getAllTravelPlans: [TravelPlan!]!

    # Workflow queries
    getWorkflowExecution(id: String!): WorkflowExecution
  }

  type Mutation {
    # Travel mutations
    createTravelPlan(input: TravelPlanInput!): TravelPlan!
    updateTravelPlan(id: String!, input: TravelPlanInput!): TravelPlan!
    deleteTravelPlan(id: String!): Boolean!

    # Workflow mutations
    executeLocationWorkflow(ip: String!): WorkflowExecution!
    executeWeatherWorkflow(ip: String): WorkflowExecution!
    executeTravelPlanningWorkflow(ip: String, destination: String, startDate: String!, endDate: String!): WorkflowExecution!
  }

  type Subscription {
    workflowUpdates(workflowId: String!): WorkflowExecution!
  }
`;

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
