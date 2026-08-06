import { describe, it, expect, beforeEach } from 'vitest';
import { Role } from '../types/database';
import { seedInitialData, getCurrentUser, loginAs, loginWithEmail, setCurrentUser, resetMemoryStore } from '../lib/db';

describe('Phase 1: Teacher & Admin Authentication Tests', () => {
  beforeEach(() => {
    resetMemoryStore();
    seedInitialData();
  });

  it('should seed default teacher and admin accounts', () => {
    const user = getCurrentUser();
    expect(user).not.toBeNull();
    expect(user?.role).toBe(Role.TEACHER);
    expect(user?.name).toContain('Dr. Selin Yılmaz');
  });

  it('should switch role to ADMIN when requested', () => {
    const admin = loginAs(Role.ADMIN);
    expect(admin.role).toBe(Role.ADMIN);
    expect(getCurrentUser()?.role).toBe(Role.ADMIN);
  });

  it('should authenticate user via email', () => {
    const user = loginWithEmail('test.ogretmen@k12.tr', 'Fatma Öğretmen');
    expect(user.email).toBe('test.ogretmen@k12.tr');
    expect(user.role).toBe(Role.TEACHER);
    expect(getCurrentUser()?.email).toBe('test.ogretmen@k12.tr');
  });

  it('should handle logout cleanly', () => {
    setCurrentUser(null);
    expect(getCurrentUser()).toBeNull();
  });
});
