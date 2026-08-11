import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Zod schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  unitPrice: z.number().min(0, 'unitPrice must be >= 0'),
  category: z.string().optional(),
  location: z.string().optional(),
  currentStock: z.number().default(0),
  minStockAlert: z.number().default(0),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  unitPrice: z.number().min(0).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  minStockAlert: z.number().optional(),
}); // notice currentStock is omitted so it can't be updated directly via PUT

const stockMovementSchema = z.object({
  quantity: z.number().positive('Quantity must be greater than 0'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().optional(),
});

// Roles: ADMIN and WAREHOUSE can create/edit products and record stock. ADMIN, SALES, WAREHOUSE, ACCOUNTS can view.
const readRoles = ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as const;
const writeRoles = ['ADMIN', 'WAREHOUSE'] as const;

// GET /products
router.get('/', authenticate, authorize(...readRoles), async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const category = req.query.category as string;
    const lowStock = req.query.lowStock === 'true';

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (category) {
      where.category = category;
    }

    if (lowStock) {
      const lowStockProducts = await prisma.$queryRaw<{id: string}[]>`SELECT id FROM "Product" WHERE "currentStock" <= "minStockAlert"`;
      if (where.id) {
         // This is edge case, unlikely, but just override for simplicity.
      }
      where.id = { in: lowStockProducts.map(p => p.id) };
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /products/:id
router.get('/:id', authenticate, authorize(...readRoles), async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id as string },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { createdBy: { select: { name: true, email: true } } }
        }
      }
    });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /products
router.post('/', authenticate, authorize(...writeRoles), async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createProductSchema.safeParse(req.body);
    if (!validatedData.success) {
      res.status(400).json({ error: 'Validation failed', details: validatedData.error.issues });
      return;
    }

    const product = await prisma.product.create({
      data: validatedData.data,
    });
    res.status(201).json(product);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'A product with this SKU already exists' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /products/:id
router.put('/:id', authenticate, authorize(...writeRoles), async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = updateProductSchema.safeParse(req.body);
    if (!validatedData.success) {
      res.status(400).json({ error: 'Validation failed', details: validatedData.error.issues });
      return;
    }

    const existing = await prisma.product.findUnique({ where: { id: req.params.id as string } });
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const product = await prisma.product.update({
      where: { id: req.params.id as string },
      data: validatedData.data,
    });
    res.json(product);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'A product with this SKU already exists' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /products/:id/stock-movement
router.post('/:id/stock-movement', authenticate, authorize(...writeRoles), async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = stockMovementSchema.safeParse(req.body);
    if (!validatedData.success) {
      res.status(400).json({ error: 'Validation failed', details: validatedData.error.issues });
      return;
    }

    const { quantity, movementType, reason } = validatedData.data;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: req.params.id as string } });
      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      if (movementType === 'OUT' && product.currentStock < quantity) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      const stockMovement = await tx.stockMovement.create({
        data: {
          productId: product.id,
          quantity,
          movementType,
          reason,
          createdById: req.user!.userId,
        }
      });

      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          currentStock: {
            [movementType === 'IN' ? 'increment' : 'decrement']: quantity
          }
        }
      });

      return { product: updatedProduct, stockMovement };
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === 'PRODUCT_NOT_FOUND') {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    if (error.message === 'INSUFFICIENT_STOCK') {
      res.status(400).json({ error: 'Insufficient stock to fulfill this OUT movement' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
