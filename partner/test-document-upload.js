/**
 * Test script for document upload endpoint
 *
 * Usage:
 *   node test-document-upload.js
 *
 * This script tests the document upload endpoint by:
 * 1. Creating a test file
 * 2. Sending it to the proxy endpoint
 * 3. Verifying the response
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const PROXY_URL = process.env.PROXY_URL || 'http://localhost:3000';
const TEST_ENDPOINT = `${PROXY_URL}/api/proxy/api/v1/documents/upload`;

// Test data - you'll need to provide valid GUIDs
const TEST_CASE_ID = process.env.TEST_CASE_ID || '00000000-0000-0000-0000-000000000001';
const TEST_PARTNER_ID =
  process.env.TEST_PARTNER_ID || '00000000-0000-0000-0000-000000000002';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';

async function testDocumentUpload() {
  console.log('🧪 Testing Document Upload Endpoint');
  console.log('=====================================\n');

  // Create a test file
  const testFileName = 'test-document.txt';
  const testFileContent = 'This is a test document for upload verification.';
  const testFilePath = path.join(__dirname, testFileName);

  try {
    // Write test file
    fs.writeFileSync(testFilePath, testFileContent);
    console.log(
      `✅ Created test file: ${testFileName} (${testFileContent.length} bytes)`
    );

    // Create FormData
    const formData = new FormData();

    // Create a file stream
    const fileStream = fs.createReadStream(testFilePath);

    // Append file - must match C# property name 'File'
    formData.append('File', fileStream, testFileName);

    // Append required fields - must match C# property names
    formData.append('CaseId', TEST_CASE_ID);
    formData.append('PartnerId', TEST_PARTNER_ID);
    formData.append('Type', '99'); // DocumentType.Other

    // Append optional fields
    formData.append('Description', 'Test document upload');
    formData.append('UploadedBy', TEST_USER_EMAIL);

    console.log('\n📤 Sending request to:', TEST_ENDPOINT);
    console.log('Request fields:');
    console.log(`  - CaseId: ${TEST_CASE_ID}`);
    console.log(`  - PartnerId: ${TEST_PARTNER_ID}`);
    console.log(`  - Type: 99 (Other)`);
    console.log(`  - File: ${testFileName}`);
    console.log(`  - Description: Test document upload`);
    console.log(`  - UploadedBy: ${TEST_USER_EMAIL}\n`);

    // Send request
    const response = await fetch(TEST_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: {
        'X-User-Email': TEST_USER_EMAIL,
        'X-User-Name': 'Test User',
        'X-User-Role': 'Applicant',
        // Don't set Content-Type - form-data will set it with boundary
        ...formData.getHeaders(),
      },
    });

    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📥 Response Headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`📥 Response Body:`, responseText);

    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('\n✅ SUCCESS! Document uploaded successfully:');
        console.log(JSON.stringify(result, null, 2));
        return true;
      } catch (parseError) {
        console.log('\n⚠️  Response is not JSON, but status is OK');
        return true;
      }
    } else {
      console.log('\n❌ FAILED! Upload returned error status');
      try {
        const error = JSON.parse(responseText);
        console.log('Error details:', JSON.stringify(error, null, 2));
      } catch {
        console.log('Error response (not JSON):', responseText);
      }
      return false;
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    return false;
  } finally {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log(`\n🧹 Cleaned up test file: ${testFileName}`);
    }
  }
}

// Run the test
if (require.main === module) {
  testDocumentUpload()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testDocumentUpload };
