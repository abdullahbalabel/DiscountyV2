// Discounty - Full Development Environment Setup
// Run: npm run setup

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function log(step, msg) {
  console.log(`\n[${step}] ${msg}`);
}

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });
}

// ── Step 1: .env file ──────────────────────────────

const envPath = path.join(ROOT, '.env');
const envExamplePath = path.join(ROOT, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    log('1/4', '.env created from .env.example — fill in your real values before running again.');
    console.log('  Edit .env then re-run: npm run setup');
    process.exit(0);
  } else {
    log('ERROR', '.env and .env.example both missing.');
    process.exit(1);
  }
} else {
  log('1/4', '.env exists');
}

// Parse .env
const env = {};
fs.readFileSync(envPath, 'utf-8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .forEach(line => {
    const [key, ...rest] = line.split('=');
    env[key.trim()] = rest.join('=').trim();
  });

// Validate required vars
const required = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'FIREBASE_PROJECT_NUMBER',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_APP_ID',
  'FIREBASE_API_KEY',
  'FIREBASE_PACKAGE_NAME',
];

const missing = required.filter(key => !env[key]);
if (missing.length > 0) {
  log('ERROR', `Missing required .env variables:\n  - ${missing.join('\n  - ')}`);
  console.log('  Fill them in .env and re-run: npm run setup');
  process.exit(1);
}

// ── Step 2: npm install ────────────────────────────

const nodeModulesPath = path.join(ROOT, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  log('2/4', 'Installing dependencies...');
  run('npm install');
} else {
  log('2/4', 'node_modules exists — skipping npm install');
}

// ── Step 3: google-services.json ───────────────────

log('3/4', 'Generating google-services.json...');

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

const gsOutPath = path.join(ROOT, 'google-services.json');
fs.writeFileSync(gsOutPath, JSON.stringify(googleServices, null, 2));
console.log('  google-services.json written');

// ── Step 4: Expo prebuild (native directories) ────

const iosDir = path.join(ROOT, 'ios');
const androidDir = path.join(ROOT, 'android');

if (!fs.existsSync(iosDir) || !fs.existsSync(androidDir)) {
  log('4/4', 'Generating native directories (expo prebuild)...');
  try {
    run('npx expo prebuild');
    console.log('  Native directories generated');
  } catch {
    console.log('  prebuild skipped (may require interactive input — run manually: npx expo prebuild)');
  }
} else {
  log('4/4', 'ios/ and android/ already exist — skipping prebuild');
}

// ── Done ───────────────────────────────────────────

console.log('\nSetup complete. Start the app with: npm start\n');
