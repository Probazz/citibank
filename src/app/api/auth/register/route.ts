import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateAccountNumber, generateCardNumber, generateReference } from '@/lib/utils';
import { z } from 'zod';

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const accountNumber  = generateAccountNumber();
    const savingsAccountNumber = generateAccountNumber();
    const cardNumber     = generateCardNumber();

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        city: data.city,
        state: data.state,
        account: {
          create: {
            accountNumber,
            savingsAccountNumber,
            balance: 0,
            savingsBalance: 0,
            cards: {
              create: {
                cardNumber,
                cardHolder: `${data.firstName} ${data.lastName}`.toUpperCase(),
                expiryMonth: '12',
                expiryYear: '2029',
                cvv: Math.floor(100 + Math.random() * 900).toString(),
                cardType: 'VISA',
              },
            },
          },
        },
      },
      include: { account: true },
    });

    // Welcome notification
    await prisma.notification.create({
      data: {
        title: 'Welcome to Citi! 🎉',
        message: `Your checking account ending in ${accountNumber.slice(-4)} is ready. Your routing number is 021000089.`,
        type: 'success',
        userId: user.id,
      },
    });

    return NextResponse.json({
      message: 'Account created successfully.',
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    }, { status: 201 });
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Invalid input data.', details: err.errors }, { status: 400 });
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}