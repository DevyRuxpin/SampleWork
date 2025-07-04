import { render, screen, fireEvent } from '@testing-library/react';
import Todo from './Todo';

const mockRemoveTodo = jest.fn();

test('renders without crashing', () => {
  render(<Todo id={1} task="Buy groceries" removeTodo={mockRemoveTodo} />);
});

test('matches snapshot', () => {
  const { asFragment } = render(<Todo id={1} task="Buy groceries" removeTodo={mockRemoveTodo} />);
  expect(asFragment()).toMatchSnapshot();
});

test('renders task text', () => {
  render(<Todo id={1} task="Buy groceries" removeTodo={mockRemoveTodo} />);
  expect(screen.getByText('Buy groceries')).toBeInTheDocument();
});

test('renders remove button', () => {
  render(<Todo id={1} task="Buy groceries" removeTodo={mockRemoveTodo} />);
  expect(screen.getByText('X')).toBeInTheDocument();
});

test('calls removeTodo when X button is clicked', () => {
  render(<Todo id={1} task="Buy groceries" removeTodo={mockRemoveTodo} />);
  
  const removeButton = screen.getByText('X');
  fireEvent.click(removeButton);
  
  expect(mockRemoveTodo).toHaveBeenCalledWith(1);
}); 