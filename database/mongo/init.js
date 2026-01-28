/**
 * MongoDB スキーマ定義と初期データ
 */

// データベース選択
db = db.getSiblingDB('benchmark_db');

// usersコレクション作成（スキーマ検証付き）
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'age'],
      properties: {
        _id: { bsonType: 'objectId' },
        name: {
          bsonType: 'string',
          description: 'ユーザー名'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'メールアドレス'
        },
        age: {
          bsonType: 'int',
          minimum: 0,
          maximum: 150,
          description: '年齢'
        },
        created_at: {
          bsonType: 'date',
          description: '作成日時'
        },
        updated_at: {
          bsonType: 'date',
          description: '更新日時'
        }
      }
    }
  }
});

// インデックス作成
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ created_at: 1 });

// サンプルデータ挿入
db.users.insertMany([
  {
    name: '田中太郎',
    email: 'tanaka@example.com',
    age: 30,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: '山田花子',
    email: 'yamada@example.com',
    age: 28,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: '佐藤次郎',
    email: 'sato@example.com',
    age: 35,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: '鈴木美咲',
    email: 'suzuki@example.com',
    age: 26,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: '渡辺健一',
    email: 'watanabe@example.com',
    age: 40,
    created_at: new Date(),
    updated_at: new Date()
  }
]);

print('MongoDB: スキーマ定義とデータ挿入完了');
