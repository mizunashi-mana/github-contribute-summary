'use client';

import { PullRequestWithReviews } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, parseISO, startOfMonth, eachMonthOfInterval, endOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';

interface PRChartProps {
  prs: PullRequestWithReviews[];
  title: string;
  type: 'created' | 'reviewed';
}

export function PRChart({ prs, title, type }: PRChartProps) {
  const generateChartData = () => {
    if (prs.length === 0) return [];

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const months = eachMonthOfInterval({
      start: sixMonthsAgo,
      end: now,
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      let created = 0;
      let reviewStarted = 0;
      let approved = 0;
      let merged = 0;

      prs.forEach((pr) => {
        const createdAt = parseISO(pr.created_at);
        const reviewStartedAt = pr.review_started_at ? parseISO(pr.review_started_at) : null;
        const approvedAt = pr.review_approved_at ? parseISO(pr.review_approved_at) : null;
        const mergedAt = pr.merged_at ? parseISO(pr.merged_at) : null;

        if (createdAt >= monthStart && createdAt <= monthEnd) {
          created++;
        }
        if (reviewStartedAt && reviewStartedAt >= monthStart && reviewStartedAt <= monthEnd) {
          reviewStarted++;
        }
        if (approvedAt && approvedAt >= monthStart && approvedAt <= monthEnd) {
          approved++;
        }
        if (mergedAt && mergedAt >= monthStart && mergedAt <= monthEnd) {
          merged++;
        }
      });

      return {
        month: format(month, 'yyyy/MM', { locale: ja }),
        created,
        reviewStarted,
        approved,
        merged,
      };
    });
  };

  const data = generateChartData();

  if (data.length === 0) {
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
      <ResponsiveContainer width="100%" height={300}>
        {type === 'created'
          ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="created" fill="#3B82F6" name="作成" />
                <Bar dataKey="reviewStarted" fill="#10B981" name="レビュー開始" />
                <Bar dataKey="merged" fill="#8B5CF6" name="マージ" />
              </BarChart>
            )
          : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="reviewStarted" stroke="#10B981" name="レビュー開始" />
                <Line type="monotone" dataKey="approved" stroke="#F59E0B" name="レビュー通過" />
              </LineChart>
            )}
      </ResponsiveContainer>
    </div>
  );
}
