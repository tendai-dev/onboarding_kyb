#!/usr/bin/env node

/**
 * Script to automatically fix Keycloak redirect URI configuration
 * This uses the Keycloak Admin REST API to update the client configuration
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
      // Remove quotes
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

const KEYCLOAK_ISSUER = processEnv.KEYCLOAK_ISSUER || 'http://localhost:8080/realms/mukuru';
const KEYCLOAK_BASE_URL = KEYCLOAK_ISSUER.replace('/realms/mukuru', '').replace('/realms/.*', '') || 'http://localhost:8080';
const KEYCLOAK_REALM = 'mukuru';
const KEYCLOAK_CLIENT_ID = processEnv.KEYCLOAK_CLIENT_ID || 'kyb-connect-portal';
const NEXTAUTH_URL = processEnv.NEXTAUTH_URL || 'http://localhost:3000';
const REDIRECT_URI = `${NEXTAUTH_URL}/api/auth/callback/keycloak`;

// Keycloak Admin credentials (update these if needed)
const ADMIN_USERNAME = processEnv.KEYCLOAK_ADMIN_USER || 'admin';
const ADMIN_PASSWORD = processEnv.KEYCLOAK_ADMIN_PASSWORD || 'admin';

const isHttps = KEYCLOAK_BASE_URL.startsWith('https');
const httpModule = isHttps ? https : http;

async function getAdminToken() {
  return new Promise((resolve, reject) => {
    const tokenUrl = new URL(`${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`);
    
    const postData = new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });

    const options = {
      hostname: tokenUrl.hostname,
      port: tokenUrl.port || (isHttps ? 443 : 80),
      path: tokenUrl.pathname + tokenUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData.toString()),
      },
      rejectUnauthorized: false, // For self-signed certs in dev
    };

    const req = httpModule.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            resolve(json.access_token);
          } else {
            reject(new Error(`Failed to get admin token: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse token response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData.toString());
    req.end();
  });
}

async function getClient(accessToken) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/clients`);
    url.searchParams.append('clientId', KEYCLOAK_CLIENT_ID);

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false,
    };

    const req = httpModule.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const clients = JSON.parse(data);
          if (clients && clients.length > 0) {
            resolve(clients[0]);
          } else {
            reject(new Error(`Client '${KEYCLOAK_CLIENT_ID}' not found`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse client response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function updateClient(accessToken, client) {
  return new Promise((resolve, reject) => {
    // Add redirect URI if not present
    if (!client.redirectUris || !client.redirectUris.includes(REDIRECT_URI)) {
      if (!client.redirectUris) {
        client.redirectUris = [];
      }
      client.redirectUris.push(REDIRECT_URI);
      console.log(`✅ Adding redirect URI: ${REDIRECT_URI}`);
    } else {
      console.log(`ℹ️  Redirect URI already exists: ${REDIRECT_URI}`);
    }

    // Add web origin if not present
    const webOrigin = NEXTAUTH_URL;
    if (!client.webOrigins || !client.webOrigins.includes(webOrigin)) {
      if (!client.webOrigins) {
        client.webOrigins = [];
      }
      client.webOrigins.push(webOrigin);
      console.log(`✅ Adding web origin: ${webOrigin}`);
    } else {
      console.log(`ℹ️  Web origin already exists: ${webOrigin}`);
    }

    const url = new URL(`${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/clients/${client.id}`);

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false,
    };

    const req = httpModule.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Client updated successfully!`);
          resolve();
        } else {
          reject(new Error(`Failed to update client: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(client));
    req.end();
  });
}

async function main() {
  console.log('==========================================');
  console.log('Keycloak Redirect URI Auto-Fix');
  console.log('==========================================\n');
  
  console.log('Configuration:');
  console.log(`  Keycloak URL: ${KEYCLOAK_BASE_URL}`);
  console.log(`  Realm: ${KEYCLOAK_REALM}`);
  console.log(`  Client ID: ${KEYCLOAK_CLIENT_ID}`);
  console.log(`  Redirect URI: ${REDIRECT_URI}`);
  console.log(`  Web Origin: ${NEXTAUTH_URL}\n`);

  try {
    console.log('Step 1: Getting admin token...');
    const token = await getAdminToken();
    console.log('✅ Admin token obtained\n');

    console.log('Step 2: Finding client...');
    const client = await getClient(token);
    console.log(`✅ Client found: ${client.clientId} (ID: ${client.id})\n`);

    console.log('Step 3: Updating client configuration...');
    await updateClient(token, client);
    
    console.log('\n==========================================');
    console.log('✅ SUCCESS! Keycloak configuration updated.');
    console.log('==========================================');
    console.log('\nNext steps:');
    console.log('1. Restart your Next.js server');
    console.log('2. Try logging in again\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nManual fix required:');
    console.error('1. Open Keycloak Admin Console:', `${KEYCLOAK_BASE_URL}/admin`);
    console.error('2. Go to: Realm → Clients →', KEYCLOAK_CLIENT_ID);
    console.error('3. Add redirect URI:', REDIRECT_URI);
    console.error('4. Add web origin:', NEXTAUTH_URL);
    process.exit(1);
  }
}

main();

