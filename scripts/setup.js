// Discounty - Full Development Environment Setup
// Run: npm run setup

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const IS_MAC = process.platform === 'darwin';
const TOTAL_STEPS = 8;

function log(step, msg) {
  console.log(`\n[${step}/${TOTAL_STEPS}] ${msg}`);
}

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });
}

function runSilent(cmd) {
  try {
    execSync(cmd, { stdio: 'pipe', cwd: ROOT });
    return true;
  } catch {
    return false;
  }
}

function warn(msg) {
  console.log(`  ⚠ ${msg}`);
}

function fail(msg) {
  console.log(`\n  ✘ ${msg}`);
  process.exit(1);
}

// ── Step 1: CLI prerequisites ───────────────────────

let step = 0;
function nextStep(msg) {
  step++;
  log(step, msg);
}

nextStep('Checking CLI prerequisites');

const clis = [
  { name: 'expo', cmd: 'npx expo --version', install: 'npm install -g expo-cli' },
  { name: 'eas', cmd: 'npx eas --version', install: 'npm install -g eas-cli' },
];

for (const cli of clis) {
  if (runSilent(cli.cmd)) {
    console.log(`  ✓ ${cli.name} CLI available`);
  } else {
    warn(`${cli.name} CLI not found — install with: ${cli.install}`);
  }
}

// ── Step 2: .env file ───────────────────────────────

nextStep('Validating .env');

const envPath = path.join(ROOT, '.env');
const envExamplePath = path.join(ROOT, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('  .env created from .env.example — fill in your real values before running again.');
    console.log('  Edit .env then re-run: npm run setup');
    process.exit(0);
  } else {
    fail('.env and .env.example both missing.');
  }
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

// Validate required vars exist
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
  fail(`Missing required .env variables:\n  - ${missing.join('\n  - ')}\n  Fill them in .env and re-run: npm run setup`);
}

// Validate values are not placeholders
const placeholderPatterns = [
  /^your-/i,
  /^change/i,
  /^replace/i,
  /^xxx/i,
  /^TODO$/i,
  /^FIXME$/i,
  /^INSERT_/i,
  /^sk_test/i,
  /^pk_test/i,
];

const placeholders = required.filter(key => {
  const val = env[key];
  return placeholderPatterns.some(re => re.test(val));
});

if (placeholders.length > 0) {
  warn('These .env values still look like placeholders:');
  placeholders.forEach(key => console.log(`    - ${key} = "${env[key]}"`));
  console.log('  Update them with real values for a working build.');
}

console.log('  ✓ All required .env variables present');

// ── Step 3: npm install ─────────────────────────────

nextStep('Installing dependencies');

const nodeModulesPath = path.join(ROOT, 'node_modules');
const lockfilePath = path.join(ROOT, 'package-lock.json');
let needsInstall = true;

if (fs.existsSync(nodeModulesPath)) {
  // Check if node_modules is stale relative to package-lock.json
  if (fs.existsSync(lockfilePath)) {
    const lockMtime = fs.statSync(lockfilePath).mtimeMs;
    const modulesMtime = fs.statSync(nodeModulesPath).mtimeMs;
    if (modulesMtime >= lockMtime) {
      // Also spot-check that a key dependency exists
      const expoPath = path.join(nodeModulesPath, 'expo', 'package.json');
      if (fs.existsSync(expoPath)) {
        needsInstall = false;
        console.log('  ✓ node_modules up to date — skipping npm install');
      }
    }
  }
}

if (needsInstall) {
  console.log('  node_modules missing or stale — running npm install...');
  run('npm install');
}

// ── Step 4: google-services.json ────────────────────

nextStep('Generating google-services.json');

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
console.log('  ✓ google-services.json written');

// ── Step 5: Expo prebuild (native directories) ─────

nextStep('Generating native directories (expo prebuild)');

const iosDir = path.join(ROOT, 'ios');
const androidDir = path.join(ROOT, 'android');

if (!fs.existsSync(iosDir) || !fs.existsSync(androidDir)) {
  try {
    run('npx expo prebuild');
    console.log('  ✓ Native directories generated');
  } catch {
    warn('prebuild skipped (may require interactive input — run manually: npx expo prebuild)');
  }
} else {
  console.log('  ✓ ios/ and android/ already exist — skipping prebuild');
}

// ── Step 6: CocoaPods (iOS only) ────────────────────

if (IS_MAC) {
  nextStep('Installing iOS CocoaPods');

  if (fs.existsSync(iosDir)) {
    const podsDir = path.join(iosDir, 'Pods');
    const podfileLock = path.join(iosDir, 'Podfile.lock');
    const podfile = path.join(iosDir, 'Podfile');

    let needsPodInstall = true;
    if (fs.existsSync(podsDir) && fs.existsSync(podfileLock) && fs.existsSync(podfile)) {
      const podfileMtime = fs.statSync(podfile).mtimeMs;
      const podsMtime = fs.statSync(podsDir).mtimeMs;
      if (podsMtime >= podfileMtime) {
        needsPodInstall = false;
        console.log('  ✓ Pods up to date — skipping pod install');
      }
    }

    if (needsPodInstall) {
      try {
        run('pod install', { cwd: iosDir });
        console.log('  ✓ CocoaPods installed');
      } catch {
        warn('pod install failed — try manually: cd ios && pod install');
      }
    }
  } else {
    warn('ios/ directory not found — skipping CocoaPods');
  }
} else {
  nextStep('Skipping CocoaPods (not on macOS)');
  console.log('  CocoaPods only runs on macOS — iOS builds require a Mac.');
}

// ── Step 7: EAS project link ───────────────────────

nextStep('Checking EAS project configuration');

const easJsonPath = path.join(ROOT, 'eas.json');
if (fs.existsSync(easJsonPath)) {
  try {
    const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf-8'));
    if (easJson.cli && easJson.cli.appId) {
      console.log('  ✓ EAS project linked');
    } else {
      warn('eas.json exists but no project linked — run: npx eas build:configure');
    }
  } catch {
    warn('Could not parse eas.json — run: npx eas build:configure');
  }
} else {
  warn('No eas.json found — run: npx eas build:configure');
}

// ── Step 8: TypeScript type check ──────────────────

nextStep('Running TypeScript type check');

try {
  run('npx tsc --noEmit');
  console.log('  ✓ No type errors');
} catch {
  warn('TypeScript errors found — fix them before building.');
}

// ── Done ───────────────────────────────────────────

console.log('\n  Setup complete. Start the app with: npm start\n');
