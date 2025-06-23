"use client"
import { Todo as PrismaTodo } from '@prisma/client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

type Todo = PrismaTodo & { imageUrl?: string | null, dependencies?: { id: number, title: string }[] };

const Mermaid = dynamic(() => import('react-mermaid2').then(mod => mod.default), { ssr: false });

function TodoImage({ src, alt }: { src: string, alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="w-full flex justify-center items-center min-h-[120px] bg-gray-100 rounded">
      {!loaded && <div className="animate-pulse w-32 h-24 bg-gray-300 rounded" />}
      <img
        src={src}
        alt={alt}
        className={`max-h-32 rounded shadow ${loaded ? '' : 'hidden'}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedDeps, setSelectedDeps] = useState<number[]>([]);
  const [graphData, setGraphData] = useState<any>(null);
  const [mermaidDef, setMermaidDef] = useState('');

  useEffect(() => {
    fetchTodos();
    fetchCriticalPath();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const fetchCriticalPath = async () => {
    try {
      const res = await fetch('/api/todos/critical-path');
      const data = await res.json();
      setGraphData(data);
      setMermaidDef(makeMermaidDef(data));
    } catch (e) {
      setGraphData(null);
      setMermaidDef('');
    }
  };

  const makeMermaidDef = (data: any) => {
    if (!data || !data.criticalPath) return '';
    let def = 'graph TD\n';
    const nodes = new Set();
    todos.forEach(todo => {
      if (todo.dependencies) {
        todo.dependencies.forEach(dep => {
          def += `  ${dep.id}([${dep.title}]) --> ${todo.id}([${todo.title}])\n`;
          nodes.add(dep.id);
          nodes.add(todo.id);
        });
      }
    });
    if (data.criticalPath && data.criticalPath.length > 1) {
      for (let i = 0; i < data.criticalPath.length - 1; i++) {
        const from = data.criticalPath[i].id;
        const to = data.criticalPath[i + 1].id;
        def += `  ${from} -.->|Critical| ${to}\n`;
      }
    }
    return def;
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTodo,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          dependencies: selectedDeps,
        }),
      });
      setNewTodo('');
      setDueDate('');
      setSelectedDeps([]);
      fetchTodos();
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const handleDeleteTodo = async (id:any) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      fetchTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Things To Do App</h1>
        <div className="flex mb-6">
          <input
            type="text"
            className="flex-grow p-3 rounded-l-full focus:outline-none text-gray-700"
            placeholder="Add a new todo"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <input
            type="date"
            className="p-3 text-gray-700"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <button
            onClick={handleAddTodo}
            className="bg-white text-indigo-600 p-3 rounded-r-full hover:bg-gray-100 transition duration-300"
          >
            Add
          </button>
        </div>
        <div className="mb-6">
          <label className="block text-white mb-2">Dependencies:</label>
          <select
            multiple
            className="w-full p-2 rounded"
            value={selectedDeps.map(String)}
            onChange={e => {
              const options = Array.from(e.target.selectedOptions).map(opt => Number(opt.value));
              setSelectedDeps(options);
            }}
          >
            {todos.map(todo => (
              <option key={todo.id} value={todo.id}>
                {todo.title}
              </option>
            ))}
          </select>
          <span className="text-xs text-white">(Hold Ctrl/Cmd to select multiple)</span>
        </div>
        <ul>
          {todos.map((todo:Todo) => {
            const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date();
            return (
              <li
                key={todo.id}
                className="flex flex-col gap-2 bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg"
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-800">{todo.title}</span>
                  {todo.dueDate && (
                    <span className={`ml-4 ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                      Due: {new Date(todo.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {todo.dependencies && todo.dependencies.length > 0 && (
                  <div className="text-xs text-gray-600">
                    Depends on: {todo.dependencies.map((dep: any) => dep.title).join(', ')}
                  </div>
                )}
                {todo.imageUrl && <TodoImage src={todo.imageUrl} alt={todo.title} />}
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 transition duration-300 self-end"
                >
                  {/* Delete Icon */}
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
