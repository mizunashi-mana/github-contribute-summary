# セキュリティガイド

## 概要

GitHub コントリビュート ダッシュボードは、パブリックおよびプライベートリポジトリの両方に対応しています。プライベートリポジトリにアクセスする際は、適切なセキュリティ対策を実施してください。

## 認証とトークン管理

### GitHub Personal Access Token

プライベートリポジトリにアクセスするためには、適切な権限を持つGitHub Personal Access Tokenが必要です。

#### Fine-grained Personal Access Token（推奨）

**利点:**
- リポジトリ単位の詳細権限設定
- 有効期限の設定（最大1年）
- 最小権限の原則に従った設定

**必要な権限:**
- `Contents`: Read（必須）
- `Metadata`: Read（必須）
- `Pull requests`: Read（必須）

**設定方法:**
1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. "Generate new token" をクリック
3. "Selected repositories" でアクセス対象リポジトリを選択
4. Repository permissions で上記3つの権限を設定

#### Classic Personal Access Token

**必要なスコープ:**
- パブリックリポジトリのみ: `public_repo`
- プライベートリポジトリ含む: `repo`

**注意:** Classic tokenは組織全体への広範囲アクセスとなるため、Fine-grained tokenを推奨します。

### トークンの安全な管理

#### 1. Webインターフェース使用（最推奨）

```typescript
// フロントエンドでのトークン入力
<TokenInput onTokenChange={setGithubToken} />
```

**特徴:**
- トークンはメモリ上でのみ使用
- ローカルストレージやCookieに保存されない
- ページリロード時にはトークンの再入力が必要

#### 2. 環境変数での設定

##### 暗号化での設定（推奨）

```bash
# 暗号化ツールを使用
npm run encrypt-token

# .env.localに設定
GITHUB_TOKEN="encrypted_token_string_here"
ENCRYPTION_PASSWORD="your_encryption_password"
```

##### 平文での設定（非推奨）

```bash
# .env.localに設定
GITHUB_TOKEN=your_personal_access_token_here
```

### トークン検証機能

アプリケーションでは以下のトークン検証を実装しています：

```typescript
// github-auth.ts:16-43
private validateToken(token: string): boolean {
  // GitHub token形式の検証
  const validPrefixes = ['ghp_', 'gho_', 'ghu_', 'ghs_', 'ghr_', 'github_pat_']
  // 長さの検証
  // プレフィックスベースの検証
}
```

## Fine-grained Token の権限エラー対策

### 「repository or user not found」エラーの解決方法

1. **リポジトリアクセス権限の確認**
   - Fine-grained tokenで対象リポジトリが選択されているか確認
   - "Selected repositories" に正しくリポジトリが追加されているか確認

2. **必要な権限の設定**
   - `Contents`: Read - リポジトリのファイル内容へのアクセスに必要
   - `Metadata`: Read - リポジトリのメタデータ（基本情報）へのアクセスに必要
   - `Pull requests`: Read - Pull Requestsデータの読み取りに必要

3. **組織設定の確認**
   - 組織のリポジトリの場合、組織のPAT設定を確認
   - Fine-grained tokenが組織によって承認されているか確認

## セキュリティ対策

### 1. 入力検証とサニタイゼーション

```typescript
// security.ts で実装
validateGitHubUsername(user)    // ユーザー名検証
validateRepositoryName(repo)    // リポジトリ名検証
sanitizeInput(rawInput)         // 入力のサニタイズ
```

### 2. レート制限

```typescript
// API呼び出し頻度の制限
const rateLimiter = new RateLimiter(5, 60000) // 5回/分
```

### 3. エラー情報の制限

```typescript
// 内部エラー詳細の非公開
const errorMessage = error instanceof Error && error.message.includes('rate limit') 
  ? 'GitHub APIのレート制限に達しました。しばらく待ってから再試行してください。'
  : 'GitHub APIからのデータ取得に失敗しました'
```

### 4. トークンの優先順位

1. クライアント提供トークン（Webフォーム入力）
2. リクエストヘッダー（Authorization: Bearer）
3. サーバー環境変数

## プライベートリポジトリ特有の注意事項

### アクセス権限の確認

- トークンに対象リポジトリへのアクセス権限があることを確認
- 組織のアクセス設定（SSO、MFA等）が適切に構成されていることを確認

### 監査ログ

GitHub Enterprise等では、以下のアクセスが監査ログに記録されます：
- Personal Access Tokenの作成・使用
- リポジトリへのAPIアクセス
- Pull Requestデータの取得

### 組織のセキュリティポリシー

- 組織のGitHub設定でPersonal Access Tokenの使用が許可されていることを確認
- 必要に応じて組織管理者に事前承認を取得

## ベストプラクティス

### 1. 最小権限の原則

- Fine-grained tokenを使用し、必要最小限の権限のみ付与
- アクセス対象リポジトリを明示的に指定

### 2. トークンの定期的な更新

- トークンの有効期限を設定（最大1年）
- 定期的なトークンの再生成

### 3. セキュアな保存

- 本番環境では暗号化されたトークンを使用
- 環境変数での平文保存は避ける
- .envファイルをバージョン管理に含めない

### 4. ログ管理

```typescript
// APIアクセスのログ記録
private logApiAccess(url: string, method: string = 'GET'): void {
  const apiPath = url.replace(GITHUB_API_BASE, '')
  const timestamp = new Date().toISOString()
  const hasToken = !!this.auth.getToken(this.request, this.clientToken)
  console.log(`[GitHub API] ${timestamp} ${method} ${apiPath} (auth: ${hasToken ? 'yes' : 'no'})`)
}
```

## インシデント対応

### トークンの漏洩時

1. GitHub上で該当トークンを即座に削除
2. 新しいトークンを生成し、システムを更新
3. アクセスログを確認し、不正利用の有無を調査

### 不正アクセスの検知

1. GitHub Settings → Security log でアクセス履歴を確認
2. 組織の監査ログで異常なAPIアクセスパターンを検出
3. 必要に応じてセキュリティチームに報告

## トラブルシューティング

### Fine-grained Tokenでの「repository or user not found」エラー

**症状**: Repository or user not found が発生する

**原因と解決法**:
1. **権限不足**: Contents, Metadata, Pull requests すべてにRead権限を付与
2. **リポジトリ未選択**: Selected repositories に対象リポジトリを追加
3. **組織承認待ち**: 組織によるFine-grained token承認を確認

### 権限エラーのデバッグ

アプリケーションコンソールで以下のログを確認：
```
[GitHub API] 2024-xx-xx GET /repos/owner/repo/pulls (auth: yes, source: client)
```

- `source: client` - Webフォームで入力されたトークンが使用されている
- `source: header` - リクエストヘッダーのトークンが使用されている  
- `source: env` - 環境変数のトークンが使用されている

## 連絡先

セキュリティに関する問題やインシデントを発見した場合は、速やかに組織のセキュリティチームに報告してください。