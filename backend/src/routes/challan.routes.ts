import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

const readRoles = ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as const;
const writeRoles = ['ADMIN', 'SALES'] as const;

// Zod schemas
const createChallanSchema = z.object({
  customerId: z.string().uuid('Valid customer ID required'),
  items: z.array(z.object({
    productId: z.string().uuid('Valid product ID required'),
    quantity: z.number().int().positive('Quantity must be greater than 0'),
  })).min(1, 'At least one item is required'),
});

// Helper for generating challan number
async function generateChallanNumber() {
  const count = await prisma.challan.count();
  const sequence = (count + 1).toString().padStart(5, '0');
  return `CH-${sequence}`;
}

// POST /challans
router.post('/', authenticate, authorize(...writeRoles), async (req, res) => {
  try {
    const validatedData = createChallanSchema.safeParse(req.body);
    if (!validatedData.success) {
      res.status(400).json({ error: 'Validation failed', details: validatedData.error.errors });
      return;
    }

    const { customerId, items } = validatedData.data;

    // Validate customer
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    // Validate products and prepare items
    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    
    if (products.length !== new Set(productIds).size) {
      res.status(400).json({ error: 'One or more products are invalid' });
      return;
    }

    const productMap = new Map(products.map(p => [p.id, p]));
    let totalQuantity = 0;
    const challanItemsData = items.map(item => {
      const p = productMap.get(item.productId)!;
      totalQuantity += item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        productNameSnapshot: p.name,
        productSkuSnapshot: p.sku,
        unitPriceSnapshot: p.unitPrice,
      };
    });

    const challanNumber = await generateChallanNumber();

    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId,
        createdById: req.user!.userId,
        status: 'DRAFT',
        totalQuantity,
        challanItems: {
          create: challanItemsData,
        }
      },
      include: { challanItems: true },
    });

    res.status(201).json(challan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /challans
router.get('/', authenticate, authorize(...readRoles), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const status = req.query.status as any;
    const customerId = req.query.customerId as string;

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [data, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, businessName: true } },
          _count: { select: { challanItems: true } }
        }
      }),
      prisma.challan.count({ where }),
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

// GET /challans/:id
router.get('/:id', authenticate, authorize(...readRoles), async (req, res) => {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        challanItems: true,
        createdBy: { select: { name: true, email: true } },
      }
    });

    if (!challan) {
      res.status(404).json({ error: 'Challan not found' });
      return;
    }

    res.json(challan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /challans/:id/confirm
router.put('/:id/confirm', authenticate, authorize(...writeRoles), async (req, res) => {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: req.params.id },
      include: { challanItems: true }
    });

    if (!challan) {
      res.status(404).json({ error: 'Challan not found' });
      return;
    }

    if (challan.status !== 'DRAFT') {
      res.status(400).json({ error: 'Only DRAFT challans can be confirmed' });
      return;
    }

    // Interactive Transaction for all-or-nothing stock update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current stock for all involved products
      const productIds = challan.challanItems.map((i: any) => i.productId);
      const currentProducts = await tx.product.findMany({
        where: { id: { in: productIds } }
      });
      const productMap = new Map(currentProducts.map(p => [p.id, p]));

      // 2. Validate sufficient stock
      const insufficientProducts: string[] = [];
      for (const item of challan.challanItems) {
        const p = productMap.get(item.productId)!;
        if (p.currentStock < item.quantity) {
          insufficientProducts.push(`${p.name} (SKU: ${p.sku})`);
        }
      }

      if (insufficientProducts.length > 0) {
        throw new Error(`INSUFFICIENT_STOCK: ${insufficientProducts.join(', ')}`);
      }

      // 3. Deduct stock and create StockMovements
      for (const item of challan.challanItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Challan ${challan.challanNumber} confirmed`,
            createdById: req.user!.userId,
          }
        });
      }

      // 4. Update Challan status
      const updatedChallan = await tx.challan.update({
        where: { id: challan.id },
        data: { status: 'CONFIRMED' },
        include: { challanItems: true }
      });

      return updatedChallan;
    });

    res.json(result);
  } catch (error: any) {
    if (error.message?.startsWith('INSUFFICIENT_STOCK:')) {
      const missing = error.message.replace('INSUFFICIENT_STOCK: ', '');
      res.status(400).json({ error: `Insufficient stock for products: ${missing}` });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /challans/:id/cancel
router.put('/:id/cancel', authenticate, authorize(...writeRoles), async (req, res) => {
  try {
    const challan = await prisma.challan.findUnique({
      where: { id: req.params.id },
      include: { challanItems: true }
    });

    if (!challan) {
      res.status(404).json({ error: 'Challan not found' });
      return;
    }

    if (challan.status === 'CANCELLED') {
      res.status(400).json({ error: 'Challan is already CANCELLED' });
      return;
    }

    if (challan.status === 'DRAFT') {
      // Just update status, no stock impact
      const updated = await prisma.challan.update({
        where: { id: challan.id },
        data: { status: 'CANCELLED' }
      });
      res.json(updated);
      return;
    }

    if (challan.status === 'CONFIRMED') {
      // Must reverse stock inside transaction
      const result = await prisma.$transaction(async (tx) => {
        for (const item of challan.challanItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } }
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'IN',
              reason: `Challan ${challan.challanNumber} cancelled`,
              createdById: req.user!.userId,
            }
          });
        }

        const updatedChallan = await tx.challan.update({
          where: { id: challan.id },
          data: { status: 'CANCELLED' },
        });

        return updatedChallan;
      });

      res.json(result);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
