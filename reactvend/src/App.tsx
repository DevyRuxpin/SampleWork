import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VendingMachine from './components/VendingMachine';
import Soda from './components/Soda';
import Chips from './components/Chips';
import Candy from './components/Candy';
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<VendingMachine />} />
          <Route path="/soda" element={<Soda />} />
          <Route path="/chips" element={<Chips />} />
          <Route path="/candy" element={<Candy />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
