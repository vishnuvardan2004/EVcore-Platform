// Simple API test using Node.js http module
const http = require('http');

function testAPI() {
    console.log('🧪 TESTING AUTOCOMPLETE API');
    console.log('============================');
    
    const options = {
        hostname: 'localhost',
        port: 3002,
        path: '/api/vehicle-deployment/autocomplete/registration',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log('✅ API Response:');
                console.log('Success:', response.success);
                console.log('Data count:', response.data?.length || 0);
                
                if (response.data && response.data.length > 0) {
                    console.log('Sample vehicles:');
                    response.data.slice(0, 3).forEach((vehicle, index) => {
                        console.log(`  ${index + 1}. ${vehicle.registrationNumber} - ${vehicle.brand} ${vehicle.model}`);
                    });
                }
            } catch (error) {
                console.log('❌ JSON Parse Error:', error.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ API Request Error:', error.message);
        console.log('Make sure the backend is running on port 3002');
        console.log('Error code:', error.code);
        console.log('Error details:', error);
    });

    req.end();
}

testAPI();
