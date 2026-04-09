import { PrismaClient } from '@prisma/client'

// Khởi tạo một instance Prisma duy nhất để dùng chung cho toàn bộ server
export const prisma = new PrismaClient()