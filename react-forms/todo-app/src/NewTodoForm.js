import React, { useState } from 'react';

function NewTodoForm({ addTodo }) {
  const [task, setTask] = useState('');

  const handleSubmit = (evt) => {
    evt.preventDefault();
    addTodo({ task });
    setTask('');
  };

  const handleChange = (evt) => {
    setTask(evt.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="task">Task:</label>
        <input
          id="task"
          name="task"
          value={task}
          onChange={handleChange}
          type="text"
          required
        />
      </div>
      <button type="submit">Add Todo</button>
    </form>
  );
}

export default NewTodoForm; 