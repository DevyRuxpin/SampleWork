import React from 'react';
import { Link } from 'react-router-dom';
import sodaImage from '../images/soda.jpeg';

const Soda: React.FC = () => {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Soda</h1>
      <img src={sodaImage} alt="Soda" style={{ width: '300px', height: '300px', objectFit: 'cover' }} />
      <p>Refreshing carbonated beverage!</p>
      <Link to="/">Go Back</Link>
    </div>
  );
};

export default Soda; 