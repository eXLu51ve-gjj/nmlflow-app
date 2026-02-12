import * as fc from 'fast-check';
import { useStore } from '../store';

/**
 * Property-Based Tests for Store
 * Feature: app-redesign
 */

describe('Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.setState({
      isAuthenticated: false,
      user: null,
      tasks: [],
      teamMembers: [],
      workDays: [],
      chatMessages: [],
      projects: [],
      salaryPayday: 1,
      showAllTasks: false,
      backgroundId: 'default',
      selectedProjectId: null,
      isLoading: false,
    });
  });

  /**
   * Property 8: Logout State Reset
   * For any authenticated user, calling logout should reset isAuthenticated to false and user to null.
   * Validates: Requirements 4.4
   */
  test('Property 8: Logout resets authentication state for any user', () => {
    fc.assert(
      fc.property(
        // Generate random user objects
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
          phone: fc.string({ minLength: 10, maxLength: 15 }),
          avatar: fc.webUrl(),
          role: fc.constantFrom('admin', 'user') as fc.Arbitrary<'admin' | 'user'>,
          isAdmin: fc.boolean(),
          teamMemberId: fc.option(fc.uuid(), { nil: undefined }),
          dailyRate: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
          carBonus: fc.option(fc.integer({ min: 0, max: 5000 }), { nil: undefined }),
        }),
        (user) => {
          // Set user (should authenticate)
          useStore.getState().setUser(user);
          
          // Verify user is authenticated
          expect(useStore.getState().isAuthenticated).toBe(true);
          expect(useStore.getState().user).toEqual(user);
          
          // Call logout
          useStore.getState().logout();
          
          // Verify state is reset
          expect(useStore.getState().isAuthenticated).toBe(false);
          expect(useStore.getState().user).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: setUser with null should set isAuthenticated to false
   */
  test('setUser with null sets isAuthenticated to false', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1 }),
          email: fc.emailAddress(),
          phone: fc.string(),
          avatar: fc.webUrl(),
          role: fc.constantFrom('admin', 'user') as fc.Arbitrary<'admin' | 'user'>,
          isAdmin: fc.boolean(),
        }),
        (user) => {
          // Set user first
          useStore.getState().setUser(user as any);
          expect(useStore.getState().isAuthenticated).toBe(true);
          
          // Set user to null
          useStore.getState().setUser(null);
          expect(useStore.getState().isAuthenticated).toBe(false);
          expect(useStore.getState().user).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
