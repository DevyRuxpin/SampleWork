import React, { useState } from 'react';

function NewBoxForm({ addBox }) {
  const [formData, setFormData] = useState({
    width: '',
    height: '',
    backgroundColor: ''
  });

  const handleSubmit = (evt) => {
    evt.preventDefault();
    addBox(formData);
    setFormData({ width: '', height: '', backgroundColor: '' });
  };

  const handleChange = (evt) => {
    const { name, value } = evt.target;
    setFormData(formData => ({
      ...formData,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="width">Width:</label>
        <input
          id="width"
          name="width"
          value={formData.width}
          onChange={handleChange}
          type="number"
          required
        />
      </div>
      <div>
        <label htmlFor="height">Height:</label>
        <input
          id="height"
          name="height"
          value={formData.height}
          onChange={handleChange}
          type="number"
          required
        />
      </div>
      <div>
        <label htmlFor="backgroundColor">Background Color:</label>
        <input
          id="backgroundColor"
          name="backgroundColor"
          value={formData.backgroundColor}
          onChange={handleChange}
          type="text"
          required
        />
      </div>
      <button type="submit">Add Box</button>
    </form>
  );
}

export default NewBoxForm; 