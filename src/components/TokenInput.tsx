'use client';

import { useState } from 'react';

interface TokenInputProps {
  onTokenChange: (token: string) => void;
}

export function TokenInput({ onTokenChange }: TokenInputProps) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTokenChange = (value: string) => {
    setToken(value);
    onTokenChange(value);
  };

  return (
    <div className="border-t pt-4 mt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-blue-600 hover:text-blue-800 mb-2"
      >
        {isExpanded ? '▼' : '▶'}
        {' '}
        GitHubトークン設定（オプション）
      </button>

      {isExpanded && (
        <div className="space-y-3">
          <div className="text-xs text-gray-600">
            <p>GitHub Personal Access Tokenを設定することで、APIの制限を緩和できます。</p>
            <p>Classic Token（ghp_）とFine-grained Token（github_pat_）の両方に対応しています。</p>
            <p>トークンはメモリ上でのみ使用され、保存されません。</p>
            <p className="text-orange-600 font-medium">
              ⚠️ Fine-grained tokenには「Contents: Read」「Metadata: Read」「Pull requests: Read」の3つの権限が必要です。
            </p>
          </div>

          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={e => handleTokenChange(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
            >
              {showToken ? '隠す' : '表示'}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            <p>トークンの取得方法:</p>
            <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
              <li>GitHub → Settings → Developer settings</li>
              <li>Personal access tokens → Fine-grained tokens または Tokens (classic)</li>
              <li>
                Fine-grained: Repository permissions で以下を設定
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Contents: Read（必須）</li>
                  <li>Metadata: Read（必須）</li>
                  <li>Pull requests: Read（必須）</li>
                </ul>
              </li>
              <li>Classic: &quot;repo&quot; または &quot;public_repo&quot; スコープを選択</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
