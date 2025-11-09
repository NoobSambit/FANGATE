import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure Prisma for serverless environments
const prismaClientOptions: {
  log?: ('query' | 'info' | 'warn' | 'error')[];
  datasources?: {
    db?: {
      url?: string;
    };
  };
} = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
};

export const prisma = globalForPrisma.prisma || new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Don't connect immediately in serverless - connections are made on-demand
// This prevents connection pool exhaustion in serverless environments

export default prisma;
