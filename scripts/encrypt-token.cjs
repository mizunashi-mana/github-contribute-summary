#!/usr/bin/env node

const crypto = require('crypto');
const readline = require('readline');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

class TokenEncryption {
  getKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }

  validateGitHubToken(token) {
    if (!token) return false;

    const validPrefixes = [
      'ghp_',           // Classic Personal Access Token
      'gho_',           // OAuth token
      'ghu_',           // User token
      'ghs_',           // Server token
      'ghr_',           // Refresh token
      'github_pat_',     // Fine-grained Personal Access Token
    ];

    const hasValidPrefix = validPrefixes.some((prefix) => token.startsWith(prefix));
    if (!hasValidPrefix) return false;

    // Fine-grained tokens are longer (93 characters), classic tokens are ~40 characters
    if (token.startsWith('github_pat_')) {
      // Fine-grained tokens should be around 93 characters
      if (token.length < 80 || token.length > 100) return false;
    } else {
      // Classic tokens should be around 40 characters
      if (token.length < 40 || token.length > 50) return false;
    }

    return true;
  }

  encrypt(token, password) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = this.getKey(password, salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Format: salt:iv:encrypted
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData, password) {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }

    const [saltHex, ivHex, encrypted] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const key = this.getKey(password, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// コマンドライン引数のパース
const args = process.argv.slice(2);
const isCommandLine = args.length > 0;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function askPassword(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';

    stdin.on('data', function(char) {
      char = char.toString();

      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          stdout.write('*');
          break;
      }
    });
  });
}

function showUsage() {
  console.log('GitHub Token Encryption Tool');
  console.log('============================');
  console.log('');
  console.log('使用方法:');
  console.log('  npm run encrypt-token                    # 対話モード');
  console.log('  npm run encrypt-token encrypt <token> <password>   # 暗号化');
  console.log('  npm run encrypt-token decrypt <encrypted> <password> # 復号化');
  console.log('');
  console.log('例:');
  console.log('  npm run encrypt-token encrypt "ghp_xxxx" "mypassword"');
  console.log('  npm run encrypt-token decrypt "abcd:1234:..." "mypassword"');
}

async function main() {
  const encryption = new TokenEncryption();

  if (isCommandLine) {
    const [action, tokenOrEncrypted, password] = args;

    if (!action || !tokenOrEncrypted || !password) {
      showUsage();
      process.exit(1);
    }

    try {
      if (action === 'encrypt') {
        // トークンの形式を検証
        if (!encryption.validateGitHubToken(tokenOrEncrypted)) {
          console.error('\n無効なGitHubトークン形式です。');
          console.error('有効なプレフィックス: ghp_, gho_, ghu_, ghs_, ghr_, github_pat_');
          console.error('Classic token: 40-50文字, Fine-grained token: 80-100文字');
          process.exit(1);
        }

        const tokenType = tokenOrEncrypted.startsWith('github_pat_') ? 'Fine-grained' : 'Classic';
        console.log(`\n検出されたトークンタイプ: ${tokenType} Personal Access Token`);

        const encrypted = encryption.encrypt(tokenOrEncrypted, password);
        console.log('\n暗号化されたトークン:');
        console.log(encrypted);
        console.log('\n.env ファイルに以下のように設定してください:');
        console.log(`GITHUB_TOKEN="${encrypted}"`);
        console.log(`ENCRYPTION_PASSWORD="${password}"`);

      } else if (action === 'decrypt') {
        const decrypted = encryption.decrypt(tokenOrEncrypted, password);
        console.log('\n復号化されたトークン:');
        console.log(decrypted);

      } else {
        console.error('無効なアクションです。encrypt または decrypt を指定してください。');
        process.exit(1);
      }
    } catch (error) {
      console.error(`エラー: ${error.message}`);
      process.exit(1);
    }

    return;
  }

  // 対話モード
  console.log('GitHub Token Encryption Tool');
  console.log('============================');
  console.log('');
  console.log('注意: このツールは対話的な入力を必要とします。');
  console.log('非対話的な環境では、以下のようにコマンドライン引数を使用してください:');
  console.log('');
  showUsage();
  console.log('');

  try {
    const action = await askQuestion('暗号化(e)または復号化(d)を選択してください [e/d]: ');

    if (action.toLowerCase() === 'e') {
      // 暗号化
      const token = await askPassword('GitHubトークンを入力してください: ');
      const password = await askPassword('暗号化パスワードを入力してください: ');

      const encrypted = encryption.encrypt(token, password);

      console.log('\n暗号化されたトークン:');
      console.log(encrypted);
      console.log('\n.env ファイルに以下のように設定してください:');
      console.log(`GITHUB_TOKEN="${encrypted}"`);
      console.log(`ENCRYPTION_PASSWORD="${password}"`);

    } else if (action.toLowerCase() === 'd') {
      // 復号化
      const encryptedToken = await askQuestion('暗号化されたトークンを入力してください: ');
      const password = await askPassword('復号化パスワードを入力してください: ');

      try {
        const decrypted = encryption.decrypt(encryptedToken, password);

        console.log('\n復号化されたトークン:');
        console.log(decrypted);
      } catch (error) {
        console.error('\n復号化に失敗しました:', error.message);
      }

    } else {
      console.log('無効な選択です。');
    }
  } catch (error) {
    console.log('\n操作がキャンセルされました。');
  }

  rl.close();
}

main().catch(console.error);
