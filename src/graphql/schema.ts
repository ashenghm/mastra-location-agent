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

  type LocationInsights {
    demographics: String!
    economy: String!
    culture: String!
    attractions: [String!]!
    climate: String!
    livingCosts: String!
    safetyInfo: String!
    localTips: [String!]!
    bestTimeToVisit: String!
    transportation: [String!]!
  }

  type NearbyPlace {
    name: String!
    type: String!
    distance: String!
    description: String!
    coordinates: Coordinates
  }

  type Coordinates {
    latitude: Float!
    longitude: Float!
  }

  type RiskAssessment {
    overall: String!
    naturalDisasters: String!
    crimeSafety: String!
    healthRisks: String!
    travelAdvisory: String!
  }

  type LocationAnalysis {
    location: Location!
    insights: LocationInsights!
    nearbyPlaces: [NearbyPlace!]!
    recommendations: [String!]!
    riskAssessment: RiskAssessment!
  }

  type LocationComparison {
    summary: String!
    locations: [LocationComparisonItem!]!
    recommendations: ComparisonRecommendations!
  }

  type LocationComparisonItem {
    name: String!
    scores: LocationScores!
    pros: [String!]!
    cons: [String!]!
    bestFor: [String!]!
  }

  type LocationScores {
    costOfLiving: String!
    safety: String!
    culture: String!
    climate: String!
    attractions: String!
  }

  type ComparisonRecommendations {
    budget: String!
    luxury: String!
    culture: String!
    safety: String!
    overall: String!
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

  input LocationInput {
    city: String!
    country: String!
  }

  type Query {
    # Basic location queries
    getLocationFromIP(ip: String!): Location
    getCurrentLocation: Location

    # AI-powered location analysis
    getLocationInsights(
      ip: String
      city: String
      country: String
      purpose: String
    ): LocationAnalysis!

    getRiskAnalysis(
      city: String!
      country: String!
    ): String!

    getNearbyPlaces(
      city: String!
      country: String!
      radius: String
      categories: [String!]
    ): [NearbyPlace!]!

    compareLocations(
      locations: [LocationInput!]!
      criteria: [String!]
    ): LocationComparison!

    # Workflow queries
    getWorkflowExecution(id: String!): WorkflowExecution
  }

  type Mutation {
    # Workflow mutations
    executeLocationWorkflow(ip: String!): WorkflowExecution!
    executeLocationAnalysisWorkflow(
      ip: String
      city: String
      country: String
      purpose: String
    ): WorkflowExecution!
  }

  type Subscription {
    workflowUpdates(workflowId: String!): WorkflowExecution!
  }
`;

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
