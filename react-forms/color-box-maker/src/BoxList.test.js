import { render, screen, fireEvent } from '@testing-library/react';
import BoxList from './BoxList';

test('renders without crashing', () => {
  render(<BoxList />);
});

test('matches snapshot', () => {
  const { asFragment } = render(<BoxList />);
  expect(asFragment()).toMatchSnapshot();
});

test('renders form inputs', () => {
  render(<BoxList />);
  expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/background color/i)).toBeInTheDocument();
  expect(screen.getByText(/add box/i)).toBeInTheDocument();
});

test('can add a new box', () => {
  render(<BoxList />);
  
  const widthInput = screen.getByLabelText(/width/i);
  const heightInput = screen.getByLabelText(/height/i);
  const colorInput = screen.getByLabelText(/background color/i);
  const submitButton = screen.getByText(/add box/i);

  fireEvent.change(widthInput, { target: { value: '100' } });
  fireEvent.change(heightInput, { target: { value: '100' } });
  fireEvent.change(colorInput, { target: { value: 'red' } });
  fireEvent.click(submitButton);

  // Check that the box was added (should have a remove button)
  expect(screen.getByText('X')).toBeInTheDocument();
});

test('can remove a box', () => {
  render(<BoxList />);
  
  // Add a box first
  const widthInput = screen.getByLabelText(/width/i);
  const heightInput = screen.getByLabelText(/height/i);
  const colorInput = screen.getByLabelText(/background color/i);
  const submitButton = screen.getByText(/add box/i);

  fireEvent.change(widthInput, { target: { value: '100' } });
  fireEvent.change(heightInput, { target: { value: '100' } });
  fireEvent.change(colorInput, { target: { value: 'red' } });
  fireEvent.click(submitButton);

  // Remove the box
  const removeButton = screen.getByText('X');
  fireEvent.click(removeButton);

  // Check that the box was removed
  expect(screen.queryByText('X')).not.toBeInTheDocument();
});

test('form clears after submission', () => {
  render(<BoxList />);
  
  const widthInput = screen.getByLabelText(/width/i);
  const heightInput = screen.getByLabelText(/height/i);
  const colorInput = screen.getByLabelText(/background color/i);
  const submitButton = screen.getByText(/add box/i);

  fireEvent.change(widthInput, { target: { value: '100' } });
  fireEvent.change(heightInput, { target: { value: '100' } });
  fireEvent.change(colorInput, { target: { value: 'red' } });
  fireEvent.click(submitButton);

  // Check that form inputs are cleared
  expect(widthInput.value).toBe('');
  expect(heightInput.value).toBe('');
  expect(colorInput.value).toBe('');
}); 