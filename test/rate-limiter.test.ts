import { RateLimiter } from '@/lib/security';

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('制限内のリクエストを許可する', () => {
    const limiter = new RateLimiter(3, 60000); // 3 requests per minute

    expect(limiter.canMakeRequest('client1')).toBe(true);
    expect(limiter.canMakeRequest('client1')).toBe(true);
    expect(limiter.canMakeRequest('client1')).toBe(true);
  });

  test('制限を超えるリクエストを拒否する', () => {
    const limiter = new RateLimiter(2, 60000); // 2 requests per minute

    expect(limiter.canMakeRequest('client1')).toBe(true);
    expect(limiter.canMakeRequest('client1')).toBe(true);
    expect(limiter.canMakeRequest('client1')).toBe(false);
  });

  test('時間経過後にリセットされる', () => {
    const limiter = new RateLimiter(1, 1000); // 1 request per second

    expect(limiter.canMakeRequest('client1')).toBe(true);
    expect(limiter.canMakeRequest('client1')).toBe(false);

    // 1秒後
    jest.advanceTimersByTime(1001);

    expect(limiter.canMakeRequest('client1')).toBe(true);
  });

  test('異なるクライアントIDは独立して制限される', () => {
    const limiter = new RateLimiter(1, 60000);

    expect(limiter.canMakeRequest('client1')).toBe(true);
    expect(limiter.canMakeRequest('client2')).toBe(true);
    expect(limiter.canMakeRequest('client1')).toBe(false);
    expect(limiter.canMakeRequest('client2')).toBe(false);
  });

  test('デフォルト設定で動作する', () => {
    const limiter = new RateLimiter(); // Default: 10 requests per minute

    // 10回のリクエストは成功するはず
    for (let i = 0; i < 10; i++) {
      expect(limiter.canMakeRequest('client1')).toBe(true);
    }

    // 11回目は失敗するはず
    expect(limiter.canMakeRequest('client1')).toBe(false);
  });

  test('APIエンドポイントでの実用性テスト', () => {
    // 実際のAPI使用を想定したテスト
    const limiter = new RateLimiter(5, 60000); // 5 requests per minute

    const clientIP = '192.168.1.1';

    // 連続リクエストをシミュレート
    const results = [];
    for (let i = 0; i < 7; i++) {
      results.push(limiter.canMakeRequest(clientIP));
    }

    expect(results).toEqual([true, true, true, true, true, false, false]);
  });
});
