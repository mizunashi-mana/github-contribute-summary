import { injectable, inject } from 'inversify';
import sqlite3 from 'sqlite3';
import path from 'path';
import { PullRequestWithReviews, Review, PullRequestRow, ReviewRow, ReviewIdRow } from '@/types';
import type { IDatabaseService, IConfig } from '@/lib/interfaces';
import { TYPES } from '@/lib/types';

@injectable()
class Database implements IDatabaseService {
  private db: sqlite3.Database;

  constructor(@inject(TYPES.Config) private config: IConfig) {
    const dbPath = this.config.getDatabasePath();
    // Handle special case for in-memory database
    const finalPath = dbPath === ':memory:'
      ? ':memory:'
      : path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
    this.db = new sqlite3.Database(finalPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
      }
    });
    void this.init();
  }

  private dbRunAsync(sql: string, params: unknown[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err !== null) {
          reject(err);
        }
        else {
          resolve(this);
        }
      });
    });
  }

  private dbAllAsync<T>(sql: string, params: (string | number | null)[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all<T>(sql, params, (err, rows) => {
        if (err !== null) {
          reject(err);
        }
        else {
          resolve(rows);
        }
      });
    });
  }

  async init(): Promise<void> {
    await this.dbRunAsync(`
      CREATE TABLE IF NOT EXISTS pull_requests (
        id INTEGER PRIMARY KEY,
        number INTEGER NOT NULL,
        title TEXT NOT NULL,
        state TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        closed_at TEXT,
        merged_at TEXT,
        user_login TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        html_url TEXT NOT NULL,
        repository TEXT NOT NULL
      )
    `);

    await this.dbRunAsync(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY,
        pr_id INTEGER NOT NULL,
        user_login TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        body TEXT,
        state TEXT NOT NULL,
        submitted_at TEXT NOT NULL,
        repository TEXT NOT NULL,
        FOREIGN KEY (pr_id) REFERENCES pull_requests (id)
      )
    `);

    await this.dbRunAsync(`
      CREATE INDEX IF NOT EXISTS idx_pr_user ON pull_requests (user_login, repository)
    `);

    await this.dbRunAsync(`
      CREATE INDEX IF NOT EXISTS idx_review_user ON reviews (user_login, repository)
    `);
  }

  async savePullRequest(pr: PullRequestWithReviews, repository: string): Promise<void> {
    await this.dbRunAsync(`
      INSERT OR REPLACE INTO pull_requests 
      (id, number, title, state, created_at, updated_at, closed_at, merged_at, user_login, user_id, html_url, 
       repository)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      pr.id, pr.number, pr.title, pr.state, pr.created_at, pr.updated_at,
      pr.closed_at, pr.merged_at, pr.user.login, pr.user.id, pr.html_url, repository,
    ]);

    for (const review of pr.reviews) {
      await this.dbRunAsync(`
        INSERT OR REPLACE INTO reviews 
        (id, pr_id, user_login, user_id, body, state, submitted_at, repository)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        review.id, pr.id, review.user.login, review.user.id,
        review.body, review.state, review.submitted_at, repository,
      ]);
    }
  }

  async getPullRequestsByUser(userLogin: string, repository: string): Promise<PullRequestWithReviews[]> {
    const prs = await this.dbAllAsync<PullRequestRow>(`
      SELECT * FROM pull_requests 
      WHERE user_login = ? AND repository = ?
      ORDER BY created_at DESC
    `, [userLogin, repository]);

    const result: PullRequestWithReviews[] = [];

    for (const pr of prs) {
      const reviews = await this.dbAllAsync<ReviewRow>(`
        SELECT * FROM reviews 
        WHERE pr_id = ? AND repository = ?
        ORDER BY submitted_at ASC
      `, [pr.id, repository]);

      const formattedReviews: Review[] = reviews.map(review => ({
        id: review.id,
        user: {
          login: review.user_login,
          id: review.user_id,
        },
        body: review.body,
        state: review.state,
        submitted_at: review.submitted_at,
        pull_request_url: '',
      }));

      const firstReview = formattedReviews.find(r =>
        r.state === 'COMMENTED' || r.state === 'CHANGES_REQUESTED' || r.state === 'APPROVED',
      );
      const approvedReview = formattedReviews.find(r => r.state === 'APPROVED');

      result.push({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        closed_at: pr.closed_at,
        merged_at: pr.merged_at,
        user: {
          login: pr.user_login,
          id: pr.user_id,
        },
        assignees: [],
        requested_reviewers: [],
        labels: [],
        html_url: pr.html_url,
        reviews: formattedReviews,
        review_started_at: firstReview?.submitted_at,
        review_approved_at: approvedReview?.submitted_at,
      });
    }

    return result;
  }

  async getReviewedPullRequests(userLogin: string, repository: string): Promise<PullRequestWithReviews[]> {
    const reviews = await this.dbAllAsync<ReviewIdRow>(`
      SELECT DISTINCT pr_id FROM reviews 
      WHERE user_login = ? AND repository = ?
    `, [userLogin, repository]);

    const result: PullRequestWithReviews[] = [];

    for (const review of reviews) {
      const pr = await this.dbAllAsync<PullRequestRow>(`
        SELECT * FROM pull_requests 
        WHERE id = ? AND repository = ?
      `, [review.pr_id, repository]);

      if (pr.length === 0) continue;

      const prData = pr[0];
      const allReviews = await this.dbAllAsync<ReviewRow>(`
        SELECT * FROM reviews 
        WHERE pr_id = ? AND repository = ?
        ORDER BY submitted_at ASC
      `, [prData.id, repository]);

      const formattedReviews: Review[] = allReviews.map(r => ({
        id: r.id,
        user: {
          login: r.user_login,
          id: r.user_id,
        },
        body: r.body,
        state: r.state,
        submitted_at: r.submitted_at,
        pull_request_url: '',
      }));

      const userReviews = formattedReviews.filter(r => r.user.login === userLogin);
      const firstUserReview = userReviews[0];
      const approvedUserReview = userReviews.find(r => r.state === 'APPROVED');

      result.push({
        id: prData.id,
        number: prData.number,
        title: prData.title,
        state: prData.state,
        created_at: prData.created_at,
        updated_at: prData.updated_at,
        closed_at: prData.closed_at,
        merged_at: prData.merged_at,
        user: {
          login: prData.user_login,
          id: prData.user_id,
        },
        assignees: [],
        requested_reviewers: [],
        labels: [],
        html_url: prData.html_url,
        reviews: formattedReviews,
        review_started_at: firstUserReview?.submitted_at,
        review_approved_at: approvedUserReview?.submitted_at,
      });
    }

    return result;
  }

  async hasCachedData(userLogin: string, repository: string): Promise<boolean> {
    const createdPrs = await this.dbAllAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM pull_requests 
      WHERE user_login = ? AND repository = ?
    `, [userLogin, repository]);

    const reviewedPrs = await this.dbAllAsync<{ count: number }>(`
      SELECT COUNT(DISTINCT pr_id) as count FROM reviews 
      WHERE user_login = ? AND repository = ?
    `, [userLogin, repository]);

    return (createdPrs[0].count > 0) || (reviewedPrs[0].count > 0);
  }

  async getCachedData(userLogin: string, repository: string): Promise<{
    created_prs: PullRequestWithReviews[];
    reviewed_prs: PullRequestWithReviews[];
  }> {
    const [createdPrs, reviewedPrs] = await Promise.all([
      this.getPullRequestsByUser(userLogin, repository),
      this.getReviewedPullRequests(userLogin, repository),
    ]);

    return {
      created_prs: createdPrs,
      reviewed_prs: reviewedPrs,
    };
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err === null) {
          resolve();
        }
        else {
          reject(err);
        }
      });
    });
  }
}

export { Database };
