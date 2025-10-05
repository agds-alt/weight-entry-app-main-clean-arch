const testEntryAPI = async () => {
  const testData = {
    nama: "Test Customer",
    no_resi: "TEST123456789",
    berat_resi: 2.5,
    berat_aktual: 2.7,
    foto_url_1: "test1.jpg",
    foto_url_2: "test2.jpg",
    notes: "Test entry"
  };

  try {
    const response = await fetch('http://localhost:3000/api/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TEST_TOKEN'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Status:', response.status);
    console.log('Response:', await response.text());
  } catch (error) {
    console.error('Test error:', error);
  }
};

testEntryAPI();