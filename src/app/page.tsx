'use client';

import { useState, useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { TokenInput } from '@/components/TokenInput';
import { validateGitHubUsername, validateRepositoryName } from '@/lib/security';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [githubUser, setGithubUser] = useState('');
  const [repository, setRepository] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [error, setError] = useState('');
  const [shouldFetchData, setShouldFetchData] = useState(false);
  const [userInputError, setUserInputError] = useState('');
  const [repoInputError, setRepoInputError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUserChange = (value: string) => {
    setGithubUser(value);
    // リアルタイムバリデーションは行わず、エラーメッセージのみクリア
    if (userInputError) {
      setUserInputError('');
    }
  };

  const handleRepoChange = (value: string) => {
    setRepository(value);
    // リアルタイムバリデーションは行わず、エラーメッセージのみクリア
    if (repoInputError) {
      setRepoInputError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUserInputError('');
    setRepoInputError('');

    if (!githubUser || !repository) return;

    // Validate inputs
    if (!validateGitHubUsername(githubUser)) {
      setUserInputError('無効なGitHubユーザー名です');
      return;
    }

    if (!validateRepositoryName(repository)) {
      setRepoInputError('無効なリポジトリ名です。owner/repository の形式で入力してください');
      return;
    }

    setIsLoading(true);
    setShowDashboard(true);
    setShouldFetchData(true);
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          GitHub コントリビュート ダッシュボード
        </h1>

        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-2">
                GitHubユーザー名
              </label>
              <input
                type="text"
                id="user"
                value={githubUser}
                onChange={e => handleUserChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: octocat"
                required
              />
              {userInputError && (
                <p className="mt-1 text-sm text-red-600">{userInputError}</p>
              )}
            </div>

            <div>
              <label htmlFor="repo" className="block text-sm font-medium text-gray-700 mb-2">
                リポジトリ (owner/repo)
              </label>
              <input
                type="text"
                id="repo"
                value={repository}
                onChange={e => handleRepoChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: facebook/react"
                required
              />
              {repoInputError && (
                <p className="mt-1 text-sm text-red-600">{repoInputError}</p>
              )}
            </div>

            <TokenInput onTokenChange={setGithubToken} />

            <button
              type="submit"
              disabled={isLoading || !githubUser || !repository}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md
                hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '読み込み中...' : 'ダッシュボードを表示'}
            </button>
          </form>
        </div>

        {showDashboard && (
          <Dashboard
            githubUser={githubUser}
            repository={repository}
            githubToken={githubToken}
            shouldFetchData={shouldFetchData}
            onDataFetched={() => setShouldFetchData(false)}
          />
        )}
      </div>
    </main>
  );
}
