import React from 'react';
import { Link } from 'react-router-dom';
import sodaImage from '../images/soda.jpeg';
import chipsImage from '../images/chips.jpeg';
import candyImage from '../images/candy.jpeg';

const VendingMachine: React.FC = () => {
  return (
    <div>
      <h1>Vending Machine</h1>
      <h2>Choose a snack:</h2>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <Link to="/soda">
          <div style={{ textAlign: 'center' }}>
            <img src={sodaImage} alt="Soda" style={{ width: '200px', height: '200px', objectFit: 'cover' }} />
            <p>Soda</p>
          </div>
        </Link>
        <Link to="/chips">
          <div style={{ textAlign: 'center' }}>
            <img src={chipsImage} alt="Chips" style={{ width: '200px', height: '200px', objectFit: 'cover' }} />
            <p>Chips</p>
          </div>
        </Link>
        <Link to="/candy">
          <div style={{ textAlign: 'center' }}>
            <img src={candyImage} alt="Candy" style={{ width: '200px', height: '200px', objectFit: 'cover' }} />
            <p>Candy</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default VendingMachine; 