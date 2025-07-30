#!/usr/bin/env node

/**
 * Test script to verify Railway deployment
 * Usage: node test-deployment.js <railway-url>
 */

const RAILWAY_URL = process.argv[2];

if (!RAILWAY_URL) {
  console.log('Usage: node test-deployment.js <railway-url>');
  console.log('Example: node test-deployment.js https://your-app.railway.app');
  process.exit(1);
}

async function testDeployment() {
  console.log(`🧪 Testing Railway deployment at: ${RAILWAY_URL}`);
  
  try {
    // Test health check
    console.log('\n1. Testing health check...');
    const healthResponse = await fetch(`${RAILWAY_URL}/`);
    console.log(`   ✅ Health check: ${healthResponse.status}`);
    
    // Test API endpoints
    console.log('\n2. Testing API endpoints...');
    
    // Test documents endpoint
    const docsResponse = await fetch(`${RAILWAY_URL}/api/documents`);
    console.log(`   ✅ Documents API: ${docsResponse.status}`);
    
    // Test vector stores endpoint
    const vectorResponse = await fetch(`${RAILWAY_URL}/api/vector-stores`);
    console.log(`   ✅ Vector Stores API: ${vectorResponse.status}`);
    
    console.log('\n🎉 All tests passed! Railway deployment is working.');
    console.log('\n📝 Next steps:');
    console.log(`   1. Add BACKEND_URL=${RAILWAY_URL} to Vercel environment variables`);
    console.log('   2. Redeploy your Vercel frontend');
    console.log('   3. Test document upload with PDF processing');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check Railway deployment logs');
    console.log('   2. Verify environment variables are set');
    console.log('   3. Ensure database migration completed');
  }
}

testDeployment(); 