# 開発ガイド

## 概要

GitHub コントリビュート ダッシュボードは、指定されたリポジトリにおけるユーザーのPR作成・レビュー活動を可視化するWebアプリケーションです。

## 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **バックエンド**: Next.js 15 (App Router)
- **データベース**: SQLite
- **UI**: Tailwind CSS
- **チャート**: Recharts
- **日付処理**: date-fns

## セットアップ

### 前提条件

- Node.js 18以上
- npm

### インストール

```bash
# 依存関係のインストール
npm install
```

### 認証方法

GitHub APIの制限を緩和するため、以下のいずれかの方法でPersonal Access Tokenを設定できます：

#### 方法1: Webインターフェース（推奨）
- アプリケーション起動後、フォームの「GitHubトークン設定」セクションでトークンを入力
- トークンはメモリ上でのみ使用され、保存されません
- 最もセキュアな方法です

#### 方法2: 環境変数（サーバー用）

##### 平文での設定（非推奨）
```bash
# .env.localファイルを作成
cp .env.example .env.local

# .env.localにトークンを設定
GITHUB_TOKEN=your_personal_access_token_here
```

##### 暗号化での設定（推奨）
```bash
# 暗号化ツールを実行
npm run encrypt-token

# 暗号化(e)を選択し、トークンとパスワードを入力
# 出力された暗号化トークンを.env.localに設定
GITHUB_TOKEN="encrypted_token_string_here"
ENCRYPTION_PASSWORD="your_encryption_password"
```

#### 方法3: リクエストヘッダー（API呼び出し時）
```bash
curl -H "Authorization: Bearer your_token" /api/github?user=...
```

### GitHub Personal Access Tokenの取得方法

#### Fine-grained Personal Access Token（推奨）

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. "Generate new token" をクリック
3. リポジトリアクセスを設定：
   - Selected repositories: 特定のリポジトリのみ
   - Public Repositories (read-only): パブリックリポジトリへの読み取り専用アクセス
4. Repository permissions で以下を設定：
   - `Contents`: Read（必須）
   - `Metadata`: Read（必須）
   - `Pull requests`: Read（必須）
5. 生成されたトークン（`github_pat_`で始まる）を設定

#### Classic Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" をクリック
3. 必要な権限を選択：
   - `public_repo` (パブリックリポジトリへのアクセス)
   - `repo` (プライベートリポジトリにアクセスする場合)
4. 生成されたトークン（`ghp_`で始まる）を設定

#### 違いと選択指針

| トークンタイプ | プレフィックス | 長さ | 特徴 |
|--------------|--------------|------|------|
| Fine-grained | `github_pat_` | ~93文字 | リポジトリ単位の詳細権限設定、有効期限最大1年 |
| Classic      | `ghp_`        | ~40文字 | 組織全体への広範囲アクセス、無期限使用可能 |

**推奨**: セキュリティの観点からFine-grained tokenの使用を推奨します。

## 開発サーバーの起動

```bash
# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## ビルドと本番環境

```bash
# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

## コード品質

```bash
# ESLint実行
npm run lint

# ユニットテスト実行
npm test

# カバレッジ付きテスト実行
npm run test:coverage

# テスト監視モード
npm run test:watch
```

### テスト構成

- **セキュリティ機能**: 入力検証、サニタイズ、レート制限のテスト
- **暗号化機能**: トークン暗号化/復号化のテスト  
- **統合テスト**: API動作フローの総合検証
- **パフォーマンステスト**: 高負荷時の動作確認
- **実世界データテスト**: 実際のGitHubデータでの検証

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # APIルート
│   │   └── github/        # GitHub API連携
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # レイアウトコンポーネント
│   └── page.tsx          # メインページ
├── components/            # Reactコンポーネント
│   ├── Dashboard.tsx      # ダッシュボードメイン
│   ├── PRChart.tsx       # チャートコンポーネント
│   └── PullRequestTimeline.tsx # PRタイムライン
├── lib/                  # ユーティリティライブラリ
│   ├── database.ts       # SQLiteデータベース操作
│   └── github-api.ts     # GitHub API連携
└── types/               # TypeScript型定義
    └── index.ts
```

## 機能説明

### 1. PRデータ取得

- GitHub APIからユーザーが作成したPRを取得
- 各PRのレビュー情報も同時に取得
- SQLiteに永続化してパフォーマンス向上

### 2. 可視化機能

#### タイムライン表示
- PR番号、タイトル、ステータス、各種日時を表形式で表示
- PRへのリンク付き

#### チャート表示
- 過去6ヶ月の月別推移
- 作成したPR: 棒グラフ（作成・レビュー開始・マージ）
- レビューしたPR: 線グラフ（レビュー開始・通過）

### 3. データ分類

- **作成したPR**: ユーザーが作成したPRの分析
  - PR作成日時
  - レビュー開始日時（最初のレビューコメント）
  - レビュー通過日時（APPROVED状態）
  - マージ日時

- **レビューしたPR**: ユーザーがレビューしたPRの分析
  - レビュー開始日時（ユーザーの最初のレビュー）
  - レビュー通過日時（ユーザーのAPPROVED）

## トラブルシューティング

### GitHub API制限

- **症状**: "GitHub APIからのデータ取得に失敗しました"
- **原因**: APIレート制限（認証なしの場合60回/時）
- **解決**: Personal Access Tokenを設定

### 暗号化トークンエラー

- **症状**: "Failed to decrypt GitHub token"
- **原因**: 
  - 暗号化パスワードが間違っている
  - 暗号化されたトークンが破損している
- **解決**: 
  - `ENCRYPTION_PASSWORD`を確認
  - `npm run encrypt-token`で再暗号化

### データベースエラー

- **症状**: SQLite関連エラー
- **解決**: `github_data.db`ファイルを削除して再実行

### 依存関係エラー

```bash
# node_modulesとpackage-lock.jsonを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## API仕様

### GET /api/github

GitHubからPRデータを取得し、データベースに保存

**パラメータ**:
- `user`: GitHubユーザー名
- `repo`: リポジトリ名（owner/repository形式）

**レスポンス**:
```json
{
  "created_prs": [...],
  "reviewed_prs": [...]
}
```

## 今後の拡張案

1. **フィルタリング機能**
   - 期間指定
   - ラベル別集計

2. **エクスポート機能**
   - CSV出力
   - 工数レポート生成

3. **複数リポジトリ対応**
   - 横断的な分析

4. **チーム分析**
   - 複数ユーザーの集計