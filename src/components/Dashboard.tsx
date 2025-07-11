'use client';

import React, { useState, useEffect } from 'react';
import { ContributeData } from '@/types';
import { PullRequestTimeline } from '@/components/PullRequestTimeline';
import { PRChart } from '@/components/PRChart';

interface DashboardProps {
  githubUser: string;
  repository: string;
  githubToken?: string;
  shouldFetchData?: boolean;
  onDataFetched?: () => void;
}

export function Dashboard({ githubUser, repository, githubToken, shouldFetchData, onDataFetched }: DashboardProps) {
  const [data, setData] = useState<ContributeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = React.useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      }
      else {
        setLoading(true);
      }
      setError(null);

      const url = '/api/github';
      const requestBody = {
        user: githubUser,
        repo: repository,
        refresh: refresh,
        token: githubToken || undefined,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'データの取得に失敗しました');
      }

      const result = await response.json();
      setData(result);
      setIsCached(result.cached || false);

      // 初回データ取得完了を通知
      if (onDataFetched) {
        onDataFetched();
      }
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
    finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [githubUser, repository, githubToken, onDataFetched]);

  const handleRefresh = () => {
    fetchData(true);
  };

  useEffect(() => {
    // shouldFetchDataがtrueの場合のみAPIを呼び出す
    if (shouldFetchData) {
      fetchData();
    }
    else {
      // データ取得をスキップする場合はローディング状態を解除
      setLoading(false);
    }
  }, [fetchData, shouldFetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">データを取得中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">
          エラー:
          {error}
        </p>
        <p className="text-sm text-red-600 mt-2">
          GitHub APIの制限に達している可能性があります。GITHUB_TOKENを環境変数に設定することをお勧めします。
        </p>
      </div>
    );
  }

  if (!data && !shouldFetchData) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-700">上のフォームでユーザー名とリポジトリを入力し、「ダッシュボードを表示」ボタンを押してください。</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700">データが取得できませんでした</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with refresh button and cache status */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4 border">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-800">
            {githubUser}
            {' '}
            @
            {repository}
          </h1>
          {isCached && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              キャッシュ済み
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md
            hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={[
                'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9',
                'm11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
              ].join(' ')}
            />
          </svg>
          <span>{isRefreshing ? '更新中...' : 'リロード'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              {githubUser}
              {' '}
              が作成したPR
            </h2>
            <p className="text-blue-600">
              リポジトリ:
              {' '}
              {repository}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              総数:
              {' '}
              {data.created_prs.length}
              件
            </p>
          </div>

          <PRChart
            prs={data.created_prs}
            title="作成したPRの月別推移"
            type="created"
          />
        </div>

        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              {githubUser}
              {' '}
              がレビューしたPR
            </h2>
            <p className="text-green-600">
              リポジトリ:
              {' '}
              {repository}
            </p>
            <p className="text-sm text-green-600 mt-1">
              総数:
              {' '}
              {data.reviewed_prs.length}
              件
            </p>
          </div>

          <PRChart
            prs={data.reviewed_prs}
            title="レビューしたPRの月別推移"
            type="reviewed"
          />
        </div>
      </div>

      <PullRequestTimeline
        prs={data.created_prs}
        title={`${githubUser} が作成したPR一覧`}
        showReviewColumns={true}
      />

      <PullRequestTimeline
        prs={data.reviewed_prs}
        title={`${githubUser} がレビューしたPR一覧`}
        showReviewColumns={true}
      />
    </div>
  );
}
