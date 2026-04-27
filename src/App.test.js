import { render, screen } from '@testing-library/react';
import App from './App';

test('toont inlogscherm wanneer er geen sessie is', async () => {
  render(<App />);
  expect(await screen.findByPlaceholderText('Email')).toBeInTheDocument();
  expect(document.querySelector('h1')).toHaveTextContent('LaadSmart');
});
