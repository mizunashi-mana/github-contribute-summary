# GitHub API Mock Server

E2Eテスト用のGitHub APIダミーサーバです。ハードコーディングされたデータを返すシンプルな実装です。

## 起動方法

```bash
# ダミーサーバを起動
npm run mock-server

# 開発モード（nodemon使用）
npm run mock-server:dev
```

**注意**: サーバーは ES modules (.mjs) で実装されており、Node.js の ES module サポートを使用しています。

サーバーは `http://localhost:3001` で起動します。

## 利用可能なエンドポイント

### リポジトリ情報
- `GET /api/v3/repos/:owner/:repo` - リポジトリ情報を取得

### プルリクエスト
- `GET /api/v3/repos/:owner/:repo/pulls` - プルリクエスト一覧を取得
- `GET /api/v3/repos/:owner/:repo/pulls/:pull_number` - 特定のプルリクエストを取得
- `GET /api/v3/repos/:owner/:repo/pulls/:pull_number/reviews` - プルリクエストのレビューを取得

### ユーザー情報
- `GET /api/v3/users/:username` - ユーザー情報を取得

### 検索
- `GET /api/v3/search/issues` - プルリクエスト検索（type:pr）

### その他
- `GET /health` - ヘルスチェック
- `POST /api/v3/graphql` - GraphQL エンドポイント（基本的なモック）

## モックデータ

以下のリポジトリとユーザーのデータが利用可能です：

### リポジトリ
- `facebook/react`
- `microsoft/vscode`
- `vercel/next.js`

### ユーザー
- `testuser` - テスト用ユーザー
- `reviewer1` - レビュワー1
- `reviewer2` - レビュワー2

## 使用例

```bash
# リポジトリ情報を取得
curl http://localhost:3001/api/v3/repos/facebook/react

# プルリクエスト一覧を取得
curl "http://localhost:3001/api/v3/repos/facebook/react/pulls?state=all"

# 特定ユーザーのプルリクエストを検索
curl "http://localhost:3001/api/v3/search/issues?q=type:pr+repo:facebook/react+author:testuser"

# プルリクエストのレビューを取得
curl http://localhost:3001/api/v3/repos/facebook/react/pulls/101/reviews
```

## 設定

環境変数でポートを変更可能です：

```bash
PORT=3002 npm run mock-server
```

## E2Eテストでの利用

テストコードで以下のように設定してください：

```typescript
process.env.GITHUB_API_BASE = 'http://localhost:3001';
```

これでアプリケーションがモックサーバーを使用するようになります。