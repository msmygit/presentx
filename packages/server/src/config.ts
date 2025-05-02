import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Define default JWT secret here for clarity
const DEFAULT_JWT_SECRET = 'YOUR_VERY_SECRET_KEY_REPLACE_ME';

// Resolve path relative to the current file's directory
const envPath = path.resolve(__dirname, '../.env'); // Go up one level from src
console.log(`Attempting to load .env file from: ${envPath}`);

// Specify the path relative to the current working directory (project root)
const dotenvResult = dotenv.config({ path: envPath, debug: true }); // Enable debug logging

if (dotenvResult.error) {
  console.error('Error loading .env file:', dotenvResult.error);
} else {
    console.log('.env file loaded successfully.');
    // Parsed content:', dotenvResult.parsed);
}

// Log the specific variables before Zod validation
//console.log('process.env.ASTRA_DB_API_ENDPOINT:', process.env.ASTRA_DB_API_ENDPOINT);
//console.log('process.env.ASTRA_DB_TOKEN:', process.env.ASTRA_DB_TOKEN);

// Refined schema including optional JWT settings
const envSchema = z.object({
  nodeEnv: z.preprocess((val) => process.env.NODE_ENV ?? val, z.string().default('development')),
  port: z.preprocess((val) => process.env.PORT ?? val, z.coerce.number().default(8080)),
  clientUrl: z.preprocess((val) => process.env.CLIENT_URL ?? val, z.string().url().default('http://localhost:8081')),
  // Map environment variables (UPPER_SNAKE) to schema fields (camelCase)
  astraDbApiEndpoint: z.preprocess(
      (val) => process.env.ASTRA_DB_API_ENDPOINT ?? val,
      z.string({ required_error: "ASTRA_DB_API_ENDPOINT is required" }).url()
  ),
  astraDbToken: z.preprocess(
      (val) => process.env.ASTRA_DB_TOKEN ?? val,
      z.string({ required_error: "ASTRA_DB_TOKEN is required" }).startsWith('AstraCS:')
  ),
  astraDbNamespace: z.preprocess(
      (val) => process.env.ASTRA_DB_KEYSPACE ?? val,
      z.string().optional()
  ),
  // Add collection names
  presentationsCollectionName: z.preprocess(
      (val) => process.env.ASTRA_DB_PRESENTATIONS_COLLECTION ?? val,
      z.string().default('presentations')
  ),
  responsesCollectionName: z.preprocess(
      (val) => process.env.ASTRA_DB_RESPONSES_COLLECTION ?? val,
      z.string().default('page_responses')
  ),
  usersCollectionName: z.preprocess(
      (val) => process.env.USERS_COLLECTION_NAME ?? val,
      z.string().default('users')
  ),
  jwtSecret: z.preprocess(
      (val) => process.env.JWT_SECRET ?? val,
      z.string().default(DEFAULT_JWT_SECRET)
  ),
  jwtExpiresIn: z.preprocess(
      (val) => process.env.JWT_EXPIRES_IN ?? val,
      z.string().default('1h')
  ),
});

// Refinement to handle optional namespace default
const refinedSchema = envSchema.refine(
  (data) => {
    if (!data.astraDbNamespace) {
      data.astraDbNamespace = 'default_keyspace';
    }
    return true;
  }
);

const parsedConfig = envSchema.parse(process.env);

// Log warning if using default secret
if (parsedConfig.jwtSecret === DEFAULT_JWT_SECRET) {
    console.warn('\n********************************************************');
    console.warn('WARNING: Using default JWT_SECRET. ');
    console.warn('Set a strong JWT_SECRET in packages/server/.env for production!');
    console.warn('********************************************************\n');
}

// Derive namespace (example of adding derived values)
const astraDbId = parsedConfig.astraDbApiEndpoint.match(/api\/(.+)-/)?.[1];

// Final config object
// We directly export the result of spreading parsedConfig and adding derived values.
// No need to re-export parsedConfig separately.
export const config = {
  ...parsedConfig,
  astraDbNamespace: astraDbId || 'unknown',
  // Make astraDbToken available directly for easier access if needed elsewhere
  astraDbToken: parsedConfig.astraDbToken,
};

// Freeze the config object to prevent accidental modifications
Object.freeze(config); 
