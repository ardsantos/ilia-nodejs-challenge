import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const DEFAULT_DATABASE_URL = "postgresql://user_wlt:pass_wlt@localhost:5433/wallet_db";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

export default prisma;
