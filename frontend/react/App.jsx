import React, { useState, useEffect } from 'react';

/**
 * React サンプルコンポーネント
 * APIエンドポイントからデータを取得し、表示する基本的なコンポーネント
 */
function App() {
  // 取得したデータを保持するstate
  const [data, setData] = useState(null);
  // ローディング状態を管理するstate
  const [loading, setLoading] = useState(false);

  // コンポーネントマウント時にAPIからデータを取得
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // バックエンドのAPIエンドポイントを呼び出し
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
  }, []); // 依存配列が空なので、マウント時に1回だけ実行

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>React Example</h1>
      {loading ? (
        // ローディング中は「Loading...」を表示
        <p>Loading...</p>
      ) : (
        // データ取得後はメッセージとタイムスタンプを表示
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
