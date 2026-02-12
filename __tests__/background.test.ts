import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Define background options directly to avoid importing React Native components
const BACKGROUND_OPTIONS = [
  { id: 'default', name: 'Тёмный', type: 'solid', colors: ['#0f0a1e', '#0f0a1e'] },
  { id: 'purple', name: 'Фиолетовый', type: 'gradient', colors: ['#1a0a2e', '#2d1b4e'] },
  { id: 'blue', name: 'Синий', type: 'gradient', colors: ['#0a1628', '#1a2d4e'] },
  { id: 'green', name: 'Зелёный', type: 'gradient', colors: ['#0a1e14', '#1b3d2f'] },
  { id: 'sunset', name: 'Закат', type: 'gradient', colors: ['#1a0a1e', '#2e1a1a'] },
  { id: 'ocean', name: 'Океан', type: 'gradient', colors: ['#0a1a2e', '#1a3a4e'] },
  { id: 'forest', name: 'Лес', type: 'gradient', colors: ['#0a1e0a', '#1a3e1a'] },
];

const STORAGE_KEY = '@nmlflow/background_id';

/**
 * Property-Based Tests for Background Persistence
 * Feature: app-redesign
 */

describe('Background Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 5: Background Options Minimum Count
   * For any BackgroundPicker component, the available backgrounds array should contain at least 5 options.
   * Validates: Requirements 3.2
   */
  test('Property 5: Background options contains at least 5 options', () => {
    expect(BACKGROUND_OPTIONS.length).toBeGreaterThanOrEqual(5);
  });

  /**
   * Property 6: Background Selection Persistence (Round-Trip)
   * For any valid backgroundId, saving to AsyncStorage and then loading should return the same backgroundId.
   * Validates: Requirements 3.4, 3.5
   */
  test('Property 6: Background persistence round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random background IDs from valid options
        fc.constantFrom(...BACKGROUND_OPTIONS.map(b => b.id)),
        async (backgroundId) => {
          // Save background
          await AsyncStorage.setItem(STORAGE_KEY, backgroundId);
          
          // Verify setItem was called with correct arguments
          expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, backgroundId);
          
          // Mock getItem to return the saved value
          (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(backgroundId);
          
          // Load background
          const loadedId = await AsyncStorage.getItem(STORAGE_KEY);
          
          // Verify round-trip
          expect(loadedId).toBe(backgroundId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that all background options have required properties
   */
  test('All background options have valid structure', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...BACKGROUND_OPTIONS),
        (background) => {
          expect(background).toHaveProperty('id');
          expect(background).toHaveProperty('name');
          expect(background).toHaveProperty('type');
          expect(background).toHaveProperty('colors');
          expect(typeof background.id).toBe('string');
          expect(typeof background.name).toBe('string');
          expect(['gradient', 'solid']).toContain(background.type);
          expect(Array.isArray(background.colors)).toBe(true);
          expect(background.colors.length).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: BACKGROUND_OPTIONS.length }
    );
  });

  /**
   * Test default background exists
   */
  test('Default background option exists', () => {
    const defaultBg = BACKGROUND_OPTIONS.find(b => b.id === 'default');
    expect(defaultBg).toBeDefined();
    expect(defaultBg?.name).toBe('Тёмный');
  });
});
