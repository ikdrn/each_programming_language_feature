/**
 * Node.js + Express メイン実行ファイル
 */

const createExpressApp = require('./server');

const app = createExpressApp();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Node.js + Express サーバーが起動しました`);
  console.log(`リッスンポート: ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
