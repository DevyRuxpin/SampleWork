import React, { useState } from 'react';
import Box from './Box';
import NewBoxForm from './NewBoxForm';

function BoxList() {
  const [boxes, setBoxes] = useState([]);

  const addBox = (newBox) => {
    setBoxes(boxes => [...boxes, { ...newBox, id: Date.now() }]);
  };

  const removeBox = (id) => {
    setBoxes(boxes => boxes.filter(box => box.id !== id));
  };

  return (
    <div>
      <NewBoxForm addBox={addBox} />
      <div className="BoxList">
        {boxes.map(box => (
          <Box
            key={box.id}
            id={box.id}
            width={box.width}
            height={box.height}
            backgroundColor={box.backgroundColor}
            removeBox={removeBox}
          />
        ))}
      </div>
    </div>
  );
}

export default BoxList; 