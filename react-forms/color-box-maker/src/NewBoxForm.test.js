import { render, screen, fireEvent } from '@testing-library/react';
import NewBoxForm from './NewBoxForm';

const mockAddBox = jest.fn();

test('renders without crashing', () => {
  render(<NewBoxForm addBox={mockAddBox} />);
});

test('matches snapshot', () => {
  const { asFragment } = render(<NewBoxForm addBox={mockAddBox} />);
  expect(asFragment()).toMatchSnapshot();
});

test('renders all form inputs', () => {
  render(<NewBoxForm addBox={mockAddBox} />);
  
  expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/background color/i)).toBeInTheDocument();
  expect(screen.getByText(/add box/i)).toBeInTheDocument();
});

test('can update form inputs', () => {
  render(<NewBoxForm addBox={mockAddBox} />);
  
  const widthInput = screen.getByLabelText(/width/i);
  const heightInput = screen.getByLabelText(/height/i);
  const colorInput = screen.getByLabelText(/background color/i);

  fireEvent.change(widthInput, { target: { value: '100' } });
  fireEvent.change(heightInput, { target: { value: '200' } });
  fireEvent.change(colorInput, { target: { value: 'red' } });

  expect(widthInput.value).toBe('100');
  expect(heightInput.value).toBe('200');
  expect(colorInput.value).toBe('red');
});

test('calls addBox with form data on submit', () => {
  render(<NewBoxForm addBox={mockAddBox} />);
  
  const widthInput = screen.getByLabelText(/width/i);
  const heightInput = screen.getByLabelText(/height/i);
  const colorInput = screen.getByLabelText(/background color/i);
  const submitButton = screen.getByText(/add box/i);

  fireEvent.change(widthInput, { target: { value: '100' } });
  fireEvent.change(heightInput, { target: { value: '200' } });
  fireEvent.change(colorInput, { target: { value: 'red' } });
  fireEvent.click(submitButton);

  expect(mockAddBox).toHaveBeenCalledWith({
    width: '100',
    height: '200',
    backgroundColor: 'red'
  });
});

test('clears form after submission', () => {
  render(<NewBoxForm addBox={mockAddBox} />);
  
  const widthInput = screen.getByLabelText(/width/i);
  const heightInput = screen.getByLabelText(/height/i);
  const colorInput = screen.getByLabelText(/background color/i);
  const submitButton = screen.getByText(/add box/i);

  fireEvent.change(widthInput, { target: { value: '100' } });
  fireEvent.change(heightInput, { target: { value: '200' } });
  fireEvent.change(colorInput, { target: { value: 'red' } });
  fireEvent.click(submitButton);

  expect(widthInput.value).toBe('');
  expect(heightInput.value).toBe('');
  expect(colorInput.value).toBe('');
}); 