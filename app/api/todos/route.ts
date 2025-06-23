import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        dependencies: {
          select: { id: true, title: true },
        },
      },
    });
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, dueDate, dependencies } = await request.json();
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Prevent self-dependency
    if (dependencies && Array.isArray(dependencies)) {
      if (dependencies.some((depId) => typeof depId !== 'number')) {
        return NextResponse.json({ error: 'All dependencies must be valid todo IDs' }, { status: 400 });
      }
    }

    let imageUrl = null;
    const apiKey = process.env.PEXELS_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(title)}&per_page=1`, {
          headers: { Authorization: apiKey },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.photos && data.photos.length > 0) {
            imageUrl = data.photos[0].src.medium || data.photos[0].src.large || data.photos[0].src.original;
          }
        }
      } catch (e) {
        // Ignore image fetch errors, fallback to null
      }
    }

    // Create the todo first (without dependencies)
    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        imageUrl,
      },
    });

    // Prevent circular dependencies (direct only for now)
    if (dependencies && dependencies.includes(todo.id)) {
      await prisma.todo.delete({ where: { id: todo.id } });
      return NextResponse.json({ error: 'A todo cannot depend on itself.' }, { status: 400 });
    }

    // Prevent indirect circular dependencies
    if (dependencies && dependencies.length > 0) {
      // Build a map of all todos and their dependencies
      const allTodos = await prisma.todo.findMany({
        include: { dependencies: { select: { id: true } } },
      });
      const depMap: Record<number, number[]> = {};
      allTodos.forEach(t => {
        depMap[t.id] = t.dependencies.map((d: any) => d.id);
      });
      depMap[todo.id] = dependencies; // simulate the new connections

      // DFS to check for cycles
      function hasCycle(startId: number, visited: Set<number>): boolean {
        if (visited.has(startId)) return true;
        visited.add(startId);
        for (const depId of depMap[startId] || []) {
          if (hasCycle(depId, new Set(visited))) return true;
        }
        return false;
      }
      if (hasCycle(todo.id, new Set())) {
        await prisma.todo.delete({ where: { id: todo.id } });
        return NextResponse.json({ error: 'Circular dependency detected.' }, { status: 400 });
      }
    }

    // Connect dependencies if provided
    if (dependencies && dependencies.length > 0) {
      await prisma.todo.update({
        where: { id: todo.id },
        data: {
          dependencies: {
            connect: dependencies.map((id: number) => ({ id })),
          },
        },
      });
    }

    // Return the created todo with dependencies
    const createdTodo = await prisma.todo.findUnique({
      where: { id: todo.id },
      include: {
        dependencies: { select: { id: true, title: true } },
      },
    });
    return NextResponse.json(createdTodo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}