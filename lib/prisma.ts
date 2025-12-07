import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure Prisma for serverless environments
const prismaClientOptions: {
  log?: ('query' | 'info' | 'warn' | 'error')[];
} = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
};

export const prisma = globalForPrisma.prisma || new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// For serverless, we don't maintain persistent connections
// Prisma will create connections on-demand

export default prisma;
