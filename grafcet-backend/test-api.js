// Use built-in fetch in modern Node.js

const API_BASE_URL = 'http://localhost:3001/api';

async function testCreateProject() {
    console.log('🧪 Testing Project Creation...');

    const payload = {
        name: 'TestProject_' + Date.now(),
        type: 'grafcet',
        localPath: '' // Testing automatic defaulting
    };

    try {
        const response = await fetch(`${API_BASE_URL}/projects/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const status = response.status;
        const data = await response.json();

        console.log(`Status: ${status}`);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (status === 201 && data.success) {
            console.log('✅ Project creation test PASSED');
        } else {
            console.log('❌ Project creation test FAILED');
        }
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

async function testHealth() {
    console.log('🧪 Testing Health Check...');
    try {
        const response = await fetch(`http://localhost:3001/health`);
        const data = await response.json();
        console.log('Health:', data);
        if (data.status === 'OK') {
            console.log('✅ Health check PASSED');
        } else {
            console.log('❌ Health check FAILED');
        }
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
    }
}

async function runTests() {
    await testHealth();
    await testCreateProject();
}

runTests();
