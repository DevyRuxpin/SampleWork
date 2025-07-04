import React from 'react';
import { Link } from 'react-router-dom';
import chipsImage from '../images/chips.jpeg';

const Chips: React.FC = () => {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Chips</h1>
      <img src={chipsImage} alt="Chips" style={{ width: '300px', height: '300px', objectFit: 'cover' }} />
      <p>Crunchy and salty snack!</p>
      <Link to="/">Go Back</Link>
    </div>
  );
};

export default Chips; 