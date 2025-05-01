import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole } from '@/generated/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const { email, password, name } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 }); // Conflict
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: UserRole.USER, // Default role
      },
    });

    // Don't return password hash
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 }); // Created
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "An error occurred during registration" }, { status: 500 });
  }
} 