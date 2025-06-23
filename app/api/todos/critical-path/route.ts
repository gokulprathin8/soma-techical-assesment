import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type TodoDep = { id: number; dueDate: string | null; dependencies: { id: number }[] };

// Helper to build the dependency graph
function buildGraph(todos: TodoDep[]): Record<number, number[]> {
  const graph: Record<number, number[]> = {};
  todos.forEach((todo) => {
    graph[todo.id] = todo.dependencies.map((dep) => dep.id);
  });
  return graph;
}

// Helper to find the critical path (longest path in DAG)
function findCriticalPath(graph: Record<number, number[]>, todosById: Record<number, TodoDep>): TodoDep[] {
  let maxPath: number[] = [];
  function dfs(node: number, path: number[]) {
    path.push(node);
    if ((graph[node] || []).length === 0) {
      if (path.length > maxPath.length) maxPath = [...path];
    } else {
      for (const dep of graph[node]) {
        dfs(dep, path);
      }
    }
    path.pop();
  }
  Object.keys(graph).forEach((id) => {
    dfs(Number(id), []);
  });
  return maxPath.map((id) => todosById[id]);
}

// Helper to calculate earliest start date for each todo
function calcEarliestStartDates(todos: TodoDep[]): Record<number, Date> {
  const byId: Record<number, TodoDep> = Object.fromEntries(todos.map((t) => [t.id, t]));
  const memo: Record<number, Date> = {};
  function getEarliest(todo: TodoDep): Date {
    if (memo[todo.id]) return memo[todo.id];
    if (!todo.dependencies.length) return new Date();
    const maxDate = todo.dependencies
      .map((dep) => {
        const depTodo = byId[dep.id];
        return depTodo.dueDate ? new Date(depTodo.dueDate) : getEarliest(depTodo);
      })
      .reduce((a, b) => (a > b ? a : b), new Date(0));
    memo[todo.id] = maxDate;
    return maxDate;
  }
  return Object.fromEntries(todos.map((t) => [t.id, getEarliest(t)]));
}

export async function GET() {
  try {
    const todos: any[] = await prisma.todo.findMany({
      include: { dependencies: { select: { id: true } } },
    });
    const todosById: Record<number, any> = Object.fromEntries(todos.map((t) => [t.id, t]));
    const graph = buildGraph(todos);
    const criticalPath = findCriticalPath(graph, todosById);
    const earliestStartDates = calcEarliestStartDates(todos);
    return NextResponse.json({
      criticalPath,
      earliestStartDates,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error calculating critical path' }, { status: 500 });
  }
} 