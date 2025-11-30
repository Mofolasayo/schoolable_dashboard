import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Example Zustand store interface
 * Define the shape of your store state and actions
 */
interface ExampleStore {
  count: number;
  user: { name: string } | null;
  increment: () => void;
  decrement: () => void;
  setUser: (user: { name: string } | null) => void;
  reset: () => void;
}

/**
 * Initial state for the example store
 */
const initialState = {
  count: 0,
  user: null,
};

/**
 * Example Zustand store
 * Demonstrates best practices for state management:
 * - Separate state and actions
 * - Immutable updates
 * - DevTools integration for debugging
 */
export const useExampleStore = create<ExampleStore>()(
  devtools(
    (set) => ({
      ...initialState,

      increment: () =>
        set((state) => ({ count: state.count + 1 }), false, 'increment'),

      decrement: () =>
        set((state) => ({ count: state.count - 1 }), false, 'decrement'),

      setUser: (user) => set({ user }, false, 'setUser'),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'ExampleStore' }
  )
);

/**
 * Selector hooks for better performance
 * Only subscribe to specific parts of the store
 */
export const useCount = () => useExampleStore((state) => state.count);
export const useUser = () => useExampleStore((state) => state.user);
