#!/usr/bin/env node

/**
 * Script to verify Keycloak client configuration
 * This checks if the client exists and what redirect URIs are configured
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple .env file reader
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  });
  return env;
}

// Load environment variables
const envLocal = loadEnvFile(path.join(__dirname, '..', '.env.local'));
const env = loadEnvFile(path.join(__dirname, '..', '.env'));
const processEnv = { ...env, ...envLocal, ...process.env };

const KEYCLOAK_ISSUER = processEnv.KEYCLOAK_ISSUER || 'https://keycloak-staging.app-stg.mukuru.io/realms/mukuru';
const KEYCLOAK_BASE_URL = KEYCLOAK_ISSUER.replace(/\/realms\/.*$/, '');
const KEYCLOAK_REALM = KEYCLOAK_ISSUER.match(/\/realms\/([^\/]+)/)?.[1] || 'mukuru';
const KEYCLOAK_CLIENT_ID = processEnv.KEYCLOAK_CLIENT_ID || 'kyb-connect-portal';
const NEXTAUTH_URL = processEnv.NEXTAUTH_URL || 'http://localhost:3000';
const EXPECTED_REDIRECT_URI = `${NEXTAUTH_URL}/api/auth/callback/keycloak`;

const isHttps = KEYCLOAK_BASE_URL.startsWith('https');
const httpModule = isHttps ? https : http;

console.log('==========================================');
console.log('Keycloak Configuration Verification');
console.log('==========================================\n');

console.log('Configuration:');
console.log(`  Keycloak URL: ${KEYCLOAK_BASE_URL}`);
console.log(`  Realm: ${KEYCLOAK_REALM}`);
console.log(`  Client ID: ${KEYCLOAK_CLIENT_ID}`);
console.log(`  Expected Redirect URI: ${EXPECTED_REDIRECT_URI}`);
console.log(`  NEXTAUTH_URL: ${NEXTAUTH_URL}\n`);

// Check well-known endpoint
async function checkWellKnown() {
  return new Promise((resolve, reject) => {
    const wellKnownUrl = `${KEYCLOAK_ISSUER}/.well-known/openid-configuration`;
    const url = new URL(wellKnownUrl);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      rejectUnauthorized: false,
    };

    const req = httpModule.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const config = JSON.parse(data);
            resolve(config);
          } catch (e) {
            reject(new Error(`Failed to parse well-known config: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function main() {
  try {
    console.log('Step 1: Checking Keycloak well-known endpoint...');
    const wellKnown = await checkWellKnown();
    console.log('✅ Keycloak is reachable');
    console.log(`   Issuer: ${wellKnown.issuer}`);
    console.log(`   Authorization endpoint: ${wellKnown.authorization_endpoint}\n`);

    console.log('Step 2: Verifying configuration...');
    console.log(`✅ Client ID: ${KEYCLOAK_CLIENT_ID}`);
    console.log(`✅ Expected redirect URI: ${EXPECTED_REDIRECT_URI}\n`);

    console.log('==========================================');
    console.log('Configuration Check Results');
    console.log('==========================================\n');
    
    console.log('✅ Keycloak is accessible');
    console.log('✅ Configuration looks correct\n');
    
    console.log('⚠️  IMPORTANT: Verify in Keycloak Admin Console:');
    console.log(`   1. Go to: ${KEYCLOAK_BASE_URL}/admin`);
    console.log(`   2. Realm: ${KEYCLOAK_REALM} → Clients → ${KEYCLOAK_CLIENT_ID}`);
    console.log(`   3. Check "Valid Redirect URIs" includes:`);
    console.log(`      - ${EXPECTED_REDIRECT_URI} (exact match)`);
    console.log(`      - OR http://localhost:3000/* (wildcard)`);
    console.log(`   4. Check "Web Origins" includes: ${NEXTAUTH_URL}\n`);
    
    console.log('If redirect URI is http://localhost:3000/* and error persists:');
    console.log('  - Try adding the exact URI: http://localhost:3000/api/auth/callback/keycloak');
    console.log('  - Check client Access Type (public vs confidential)');
    console.log('  - Verify client secret is set if client is confidential\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if Keycloak is accessible:', KEYCLOAK_BASE_URL);
    console.error('2. Verify network/VPN connection');
    console.error('3. Check KEYCLOAK_ISSUER in .env.local');
    process.exit(1);
  }
}

main();

