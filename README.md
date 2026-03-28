# SQLite Todo App

Next.js App Router と SQLite を使ったシンプルな TODO アプリです。

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開くと、TODO アプリを確認できます。

## 構成

- `app/page.tsx`: メイン画面
- `components/todo-app.tsx`: TODO のクライアント UI
- `app/api/todos`: CRUD API
- `lib/db.ts`: SQLite 接続とテーブル初期化

SQLite のデータファイルは初回起動時に `data/todos.db` として作成されます。

## API

- `GET /api/todos`
- `POST /api/todos`
- `PATCH /api/todos/:id`
- `DELETE /api/todos/:id`

`POST` は `{ "title": "..." }`、`PATCH` は `{ "completed": true }` のような JSON を受け取ります。
