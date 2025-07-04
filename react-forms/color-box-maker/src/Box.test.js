import { render, screen, fireEvent } from '@testing-library/react';
import Box from './Box';

const mockRemoveBox = jest.fn();

test('renders without crashing', () => {
  render(<Box id={1} width={100} height={100} backgroundColor="red" removeBox={mockRemoveBox} />);
});

test('matches snapshot', () => {
  const { asFragment } = render(<Box id={1} width={100} height={100} backgroundColor="red" removeBox={mockRemoveBox} />);
  expect(asFragment()).toMatchSnapshot();
});

test('renders remove button', () => {
  render(<Box id={1} width={100} height={100} backgroundColor="red" removeBox={mockRemoveBox} />);
  expect(screen.getByText('X')).toBeInTheDocument();
});

test('calls removeBox when X button is clicked', () => {
  render(<Box id={1} width={100} height={100} backgroundColor="red" removeBox={mockRemoveBox} />);
  
  const removeButton = screen.getByText('X');
  fireEvent.click(removeButton);
  
  expect(mockRemoveBox).toHaveBeenCalledWith(1);
});

test('applies correct styles based on props', () => {
  render(<Box id={1} width={150} height={200} backgroundColor="blue" removeBox={mockRemoveBox} />);
  
  const boxDiv = screen.getByText('X').previousElementSibling;
  expect(boxDiv).toHaveStyle({
    width: '150px',
    height: '200px',
    backgroundColor: 'blue'
  });
}); 