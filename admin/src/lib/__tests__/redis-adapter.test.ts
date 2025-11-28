import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisAdapter } from '../redis-adapter';
import { getRedisClient } from '../redis-session';

vi.mock('../redis-session', () => ({
  getRedisClient: vi.fn(),
}));

describe('RedisAdapter', () => {
  const mockRedisClient = {
    setEx: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    isOpen: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getRedisClient as any).mockResolvedValue(mockRedisClient);
  });

  it('should create adapter instance', () => {
    const adapter = RedisAdapter();
    expect(adapter).toBeDefined();
    expect(adapter.createUser).toBeDefined();
    expect(adapter.getUser).toBeDefined();
  });

  it('should create user', async () => {
    const adapter = RedisAdapter();
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
    };

    const user = await adapter.createUser(userData);

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(mockRedisClient.setEx).toHaveBeenCalled();
  });

  it('should get user by id', async () => {
    const adapter = RedisAdapter();
    const userData = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    };

    mockRedisClient.get.mockResolvedValue(JSON.stringify(userData));

    const user = await adapter.getUser('user-1');

    expect(user).toEqual(userData);
  });

  it('should return null when user not found', async () => {
    const adapter = RedisAdapter();
    mockRedisClient.get.mockResolvedValue(null);

    const user = await adapter.getUser('non-existent');

    expect(user).toBeNull();
  });

  it('should get user by email', async () => {
    const adapter = RedisAdapter();
    const userId = 'user-1';
    const userData = {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
    };

    mockRedisClient.get
      .mockResolvedValueOnce(userId) // email lookup
      .mockResolvedValueOnce(JSON.stringify(userData)); // user lookup

    const user = await adapter.getUserByEmail('test@example.com');

    expect(user).toEqual(userData);
  });

  it('should update user', async () => {
    const adapter = RedisAdapter();
    const existingUser = {
      id: 'user-1',
      email: 'old@example.com',
      name: 'Old Name',
    };

    mockRedisClient.get.mockResolvedValue(JSON.stringify(existingUser));

    const updated = await adapter.updateUser({
      id: 'user-1',
      name: 'New Name',
    });

    expect(updated.name).toBe('New Name');
    expect(mockRedisClient.setEx).toHaveBeenCalled();
  });

  it('should create session', async () => {
    const adapter = RedisAdapter();
    const sessionData = {
      sessionToken: 'token-1',
      userId: 'user-1',
      expires: new Date(),
    };

    const session = await adapter.createSession(sessionData);

    expect(session).toBeDefined();
    expect(mockRedisClient.setEx).toHaveBeenCalled();
  });

  it('should get session', async () => {
    const adapter = RedisAdapter();
    const sessionData = {
      sessionToken: 'token-1',
      userId: 'user-1',
      expires: new Date(),
    };

    mockRedisClient.get.mockResolvedValue(JSON.stringify(sessionData));

    const session = await adapter.getSession('token-1');

    expect(session).toEqual(sessionData);
  });

  it('should delete session', async () => {
    const adapter = RedisAdapter();
    await adapter.deleteSession('token-1');

    expect(mockRedisClient.del).toHaveBeenCalled();
  });
});

