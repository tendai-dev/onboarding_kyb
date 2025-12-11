/**
 * SignNow Integration Test Script
 * Tests the SignNow API integration to verify credentials and connectivity
 * 
 * Usage: node scripts/test-signnow.js
 */

const { signNowApiService } = require('../src/services/signNowApi.ts');

async function testSignNowIntegration() {
  console.log('🧪 Testing SignNow Integration...\n');

  try {
    // Test 1: Authentication - Get Access Token
    console.log('1️⃣ Testing Authentication (Getting Access Token)...');
    try {
      // This will test the getAccessToken method internally
      // We'll test it by trying to get document info (which requires auth)
      const testDocumentId = 'test-doc-id';
      try {
        await signNowApiService.getDocument(testDocumentId);
      } catch (error) {
        // If we get an auth error, it means credentials are wrong
        // If we get a 404, it means auth worked but doc doesn't exist
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('Authentication failed: Invalid credentials');
        }
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.log('   ✅ Authentication successful! (Document not found is expected)');
        } else {
          throw error;
        }
      }
    } catch (error) {
      if (error.message.includes('credentials not configured')) {
        console.error('   ❌ Error: SignNow credentials not configured');
        console.error('   Please check your .env.local file has:');
        console.error('   - SIGNNOW_BASIC_AUTH_TOKEN');
        console.error('   - SIGNNOW_USERNAME');
        console.error('   - SIGNNOW_PASSWORD');
        process.exit(1);
      }
      if (error.message.includes('Authentication failed')) {
        console.error('   ❌ Authentication failed');
        console.error('   Please verify your credentials in .env.local');
        process.exit(1);
      }
      throw error;
    }

    console.log('\n✅ SignNow Integration Test Passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Credentials are configured');
    console.log('   ✅ Authentication is working');
    console.log('   ✅ Ready to use SignNow API');
    console.log('\n💡 Next steps:');
    console.log('   - Upload documents: POST /api/signnow/document');
    console.log('   - Send invites: POST /api/signnow/document/:id/invite');
    console.log('   - Download documents: GET /api/signnow/document/:id/download');

  } catch (error) {
    console.error('\n❌ SignNow Integration Test Failed!');
    console.error('\nError:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testSignNowIntegration();

