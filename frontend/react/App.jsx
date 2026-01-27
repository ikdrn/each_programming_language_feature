import React, { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/hello');
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>React Example</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        data && (
          <div>
            <p>Message: {data.message}</p>
            <p>Timestamp: {data.timestamp}</p>
          </div>
        )
      )}
    </div>
  );
}

export default App;
