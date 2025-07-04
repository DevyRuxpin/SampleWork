import React from 'react';
import { Link } from 'react-router-dom';
import candyImage from '../images/candy.jpeg';

const Candy: React.FC = () => {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Candy</h1>
      <img src={candyImage} alt="Candy" style={{ width: '300px', height: '300px', objectFit: 'cover' }} />
      <p>Sweet treat for your taste buds!</p>
      <Link to="/">Go Back</Link>
    </div>
  );
};

export default Candy; 