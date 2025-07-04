import { render, screen, fireEvent } from '@testing-library/react';
import NewTodoForm from './NewTodoForm';

const mockAddTodo = jest.fn();

test('renders without crashing', () => {
  render(<NewTodoForm addTodo={mockAddTodo} />);
});

test('matches snapshot', () => {
  const { asFragment } = render(<NewTodoForm addTodo={mockAddTodo} />);
  expect(asFragment()).toMatchSnapshot();
});

test('renders form input', () => {
  render(<NewTodoForm addTodo={mockAddTodo} />);
  
  expect(screen.getByLabelText(/task/i)).toBeInTheDocument();
  expect(screen.getByText(/add todo/i)).toBeInTheDocument();
});

test('can update form input', () => {
  render(<NewTodoForm addTodo={mockAddTodo} />);
  
  const taskInput = screen.getByLabelText(/task/i);

  fireEvent.change(taskInput, { target: { value: 'Buy groceries' } });

  expect(taskInput.value).toBe('Buy groceries');
});

test('calls addTodo with form data on submit', () => {
  render(<NewTodoForm addTodo={mockAddTodo} />);
  
  const taskInput = screen.getByLabelText(/task/i);
  const submitButton = screen.getByText(/add todo/i);

  fireEvent.change(taskInput, { target: { value: 'Buy groceries' } });
  fireEvent.click(submitButton);

  expect(mockAddTodo).toHaveBeenCalledWith({
    task: 'Buy groceries'
  });
});

test('clears form after submission', () => {
  render(<NewTodoForm addTodo={mockAddTodo} />);
  
  const taskInput = screen.getByLabelText(/task/i);
  const submitButton = screen.getByText(/add todo/i);

  fireEvent.change(taskInput, { target: { value: 'Buy groceries' } });
  fireEvent.click(submitButton);

  expect(taskInput.value).toBe('');
}); 