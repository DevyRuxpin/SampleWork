import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

const Navigation: React.FC = () => {
  return (
    <nav>
      <NavLink to="/" end>Vending Machine</NavLink>
      <NavLink to="/soda">Soda</NavLink>
      <NavLink to="/chips">Chips</NavLink>
      <NavLink to="/candy">Candy</NavLink>
    </nav>
  );
};

export default Navigation; 