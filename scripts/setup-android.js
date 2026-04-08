// Generates google-services.json from .env variables
// Run: node scripts/setup-android.js

const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.resolve(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found. Copy .env.example to .env and fill in your values.');
  process.exit(1);
}

const env = {};
fs.readFileSync(envPath, 'utf-8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .forEach(line => {
    const [key, ...rest] = line.split('=');
    env[key.trim()] = rest.join('=').trim();
  });

const required = [
  'FIREBASE_PROJECT_NUMBER',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_APP_ID',
  'FIREBASE_API_KEY',
  'FIREBASE_PACKAGE_NAME',
];

const missing = required.filter(key => !env[key]);
if (missing.length > 0) {
  console.error(`Missing required .env variables: ${missing.join(', ')}`);
  process.exit(1);
}

const googleServices = {
  project_info: {
    project_number: env.FIREBASE_PROJECT_NUMBER,
    project_id: env.FIREBASE_PROJECT_ID,
    storage_bucket: env.FIREBASE_STORAGE_BUCKET,
  },
  client: [
    {
      client_info: {
        mobilesdk_app_id: env.FIREBASE_APP_ID,
        android_client_info: {
          package_name: env.FIREBASE_PACKAGE_NAME,
        },
      },
      oauth_client: [],
      api_key: [
        {
          current_key: env.FIREBASE_API_KEY,
        },
      ],
      services: {
        appinvite_service: {
          other_platform_oauth_client: [],
        },
      },
    },
  ],
  configuration_version: 1,
};

const outPath = path.resolve(__dirname, '..', 'google-services.json');
fs.writeFileSync(outPath, JSON.stringify(googleServices, null, 2));
console.log('google-services.json generated successfully.');
