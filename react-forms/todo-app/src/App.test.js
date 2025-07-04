import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Todo App heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Todo App/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders without crashing', () => {
  render(<App />);
});

test('matches snapshot', () => {
  const { asFragment } = render(<App />);
  expect(asFragment()).toMatchSnapshot();
});
