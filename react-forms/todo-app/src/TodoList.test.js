import { render, screen, fireEvent } from '@testing-library/react';
import TodoList from './TodoList';

test('renders without crashing', () => {
  render(<TodoList />);
});

test('matches snapshot', () => {
  const { asFragment } = render(<TodoList />);
  expect(asFragment()).toMatchSnapshot();
});

test('renders form input', () => {
  render(<TodoList />);
  expect(screen.getByLabelText(/task/i)).toBeInTheDocument();
  expect(screen.getByText(/add todo/i)).toBeInTheDocument();
});

test('can add a new todo', () => {
  render(<TodoList />);
  
  const taskInput = screen.getByLabelText(/task/i);
  const submitButton = screen.getByText(/add todo/i);

  fireEvent.change(taskInput, { target: { value: 'Buy groceries' } });
  fireEvent.click(submitButton);

  // Check that the todo was added (should have a remove button)
  expect(screen.getByText('X')).toBeInTheDocument();
  expect(screen.getByText('Buy groceries')).toBeInTheDocument();
});

test('can remove a todo', () => {
  render(<TodoList />);
  
  // Add a todo first
  const taskInput = screen.getByLabelText(/task/i);
  const submitButton = screen.getByText(/add todo/i);

  fireEvent.change(taskInput, { target: { value: 'Buy groceries' } });
  fireEvent.click(submitButton);

  // Remove the todo
  const removeButton = screen.getByText('X');
  fireEvent.click(removeButton);

  // Check that the todo was removed
  expect(screen.queryByText('X')).not.toBeInTheDocument();
  expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument();
});

test('form clears after submission', () => {
  render(<TodoList />);
  
  const taskInput = screen.getByLabelText(/task/i);
  const submitButton = screen.getByText(/add todo/i);

  fireEvent.change(taskInput, { target: { value: 'Buy groceries' } });
  fireEvent.click(submitButton);

  // Check that form input is cleared
  expect(taskInput.value).toBe('');
});

test('can add multiple todos', () => {
  render(<TodoList />);
  
  const taskInput = screen.getByLabelText(/task/i);
  const submitButton = screen.getByText(/add todo/i);

  // Add first todo
  fireEvent.change(taskInput, { target: { value: 'Buy groceries' } });
  fireEvent.click(submitButton);

  // Add second todo
  fireEvent.change(taskInput, { target: { value: 'Walk dog' } });
  fireEvent.click(submitButton);

  // Check that both todos are present
  expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  expect(screen.getByText('Walk dog')).toBeInTheDocument();
  
  // Should have two remove buttons
  const removeButtons = screen.getAllByText('X');
  expect(removeButtons).toHaveLength(2);
}); 