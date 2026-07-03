

async function testEndpoint() {
  try {
    console.log('Logging in...');
    // Create a new user for testing just in case
    const username = 'testuser_' + Date.now();
    const email = username + '@example.com';
    const password = 'StrongPassword123!';

    let res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, phoneNumber: '123' + Date.now() })
    });
    
    let data = await res.json();
    if (!data.success) {
      console.log('Registration failed:', data);
      return;
    }
    
    const token = data.data.token;
    console.log('Logged in, got token:', token.slice(0, 10) + '...');

    console.log('Fetching /api/users/blocked...');
    res = await fetch('http://localhost:5000/api/users/blocked', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    data = await res.json();
    console.log('Response status:', res.status);
    console.log('Response body:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Test script error:', err);
  }
}

testEndpoint();
