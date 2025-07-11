'use client';

import { useState, useMemo } from 'react';
import { PullRequestWithReviews } from '@/types';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

interface PullRequestTimelineProps {
  prs: PullRequestWithReviews[];
  title: string;
  showReviewColumns?: boolean;
}

type SortKey = 'number' | 'title' | 'status' | 'created_at' | 'review_started_at' | 'review_approved_at' | 'merged_at';
type SortDirection = 'asc' | 'desc';

export function PullRequestTimeline({ prs, title, showReviewColumns = false }: PullRequestTimelineProps) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    }
    else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedPrs = useMemo(() => {
    const sorted = [...prs].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortKey) {
        case 'number':
          aValue = a.number;
          bValue = b.number;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.merged_at ? 'merged' : a.state;
          bValue = b.merged_at ? 'merged' : b.state;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'review_started_at':
          aValue = a.review_started_at ? new Date(a.review_started_at).getTime() : 0;
          bValue = b.review_started_at ? new Date(b.review_started_at).getTime() : 0;
          break;
        case 'review_approved_at':
          aValue = a.review_approved_at ? new Date(a.review_approved_at).getTime() : 0;
          bValue = b.review_approved_at ? new Date(b.review_approved_at).getTime() : 0;
          break;
        case 'merged_at':
          aValue = a.merged_at ? new Date(a.merged_at).getTime() : 0;
          bValue = b.merged_at ? new Date(b.merged_at).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [prs, sortKey, sortDirection]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(parseISO(dateString), 'yyyy/MM/dd HH:mm', { locale: ja });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortDirection === 'asc'
      ? <span className="text-blue-600">↑</span>
      : <span className="text-blue-600">↓</span>;
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'open':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">オープン</span>;
      case 'closed':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">クローズ</span>;
      case 'merged':
        return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">マージ済み</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">{state}</span>;
    }
  };

  if (prs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500">データがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">
                <button
                  onClick={() => handleSort('number')}
                  className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                >
                  PR#
                  {' '}
                  {getSortIcon('number')}
                </button>
              </th>
              <th className="text-left py-2">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                >
                  タイトル
                  {' '}
                  {getSortIcon('title')}
                </button>
              </th>
              <th className="text-left py-2">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                >
                  ステータス
                  {' '}
                  {getSortIcon('status')}
                </button>
              </th>
              <th className="text-left py-2">
                <button
                  onClick={() => handleSort('created_at')}
                  className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                >
                  作成日時
                  {' '}
                  {getSortIcon('created_at')}
                </button>
              </th>
              {showReviewColumns && (
                <>
                  <th className="text-left py-2">
                    <button
                      onClick={() => handleSort('review_started_at')}
                      className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                    >
                      レビュー開始日時
                      {' '}
                      {getSortIcon('review_started_at')}
                    </button>
                  </th>
                  <th className="text-left py-2">
                    <button
                      onClick={() => handleSort('review_approved_at')}
                      className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                    >
                      レビュー通過日時
                      {' '}
                      {getSortIcon('review_approved_at')}
                    </button>
                  </th>
                </>
              )}
              <th className="text-left py-2">
                <button
                  onClick={() => handleSort('merged_at')}
                  className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                >
                  マージ日時
                  {' '}
                  {getSortIcon('merged_at')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPrs.map(pr => (
              <tr key={pr.id} className="border-b hover:bg-gray-50">
                <td className="py-3">
                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    #
                    {pr.number}
                  </a>
                </td>
                <td className="py-3 max-w-xs truncate" title={pr.title}>
                  {pr.title}
                </td>
                <td className="py-3">
                  {getStatusBadge(pr.merged_at ? 'merged' : pr.state)}
                </td>
                <td className="py-3">{formatDate(pr.created_at)}</td>
                {showReviewColumns && (
                  <>
                    <td className="py-3">{formatDate(pr.review_started_at || null)}</td>
                    <td className="py-3">{formatDate(pr.review_approved_at || null)}</td>
                  </>
                )}
                <td className="py-3">{formatDate(pr.merged_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
