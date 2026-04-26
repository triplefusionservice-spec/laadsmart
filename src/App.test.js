import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('./supabase', () => {
  const sessionPromise = Promise.resolve({ data: { session: null } });
  return {
    supabase: {
      auth: {
        getSession: () => sessionPromise,
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }),
      },
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    },
  };
});

test('toont app-titel na laden', async () => {
  render(<App />);
  await waitFor(() => {
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('Laad');
    expect(title).toHaveTextContent('Smart');
  });
});
