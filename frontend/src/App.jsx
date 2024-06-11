import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const API_ENDPOINT = 'http://localhost:3001/todos'
  const fetchTodos = async () => {
    const response = await fetch(API_ENDPOINT);
    const data = await response.json();
    setTodos(data);
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!task) return;
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task }),
    });
    const newTodo = await response.json();
    setTodos([...todos, newTodo]);
    setTask('');
  };

  const handleDeleteTodo = async (id) => {
    await fetch(`${API_ENDPOINT}/${id}`, {
      method: 'DELETE',
    });
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="App">
      <h1>Todo App</h1>
      <form onSubmit={handleAddTodo}>
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Add a new task..."
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            {todo.task}
            <button onClick={() => handleDeleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
