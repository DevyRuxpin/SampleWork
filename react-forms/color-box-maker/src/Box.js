import React from 'react';

function Box({ id, width, height, backgroundColor, removeBox }) {
  const handleRemove = () => {
    removeBox(id);
  };

  const boxStyle = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor,
    display: 'inline-block',
    margin: '10px',
    border: '1px solid black'
  };

  return (
    <div style={{ display: 'inline-block', margin: '10px' }}>
      <div style={boxStyle}></div>
      <button onClick={handleRemove}>X</button>
    </div>
  );
}

export default Box; 