import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Zod schemas
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().min(1, 'Mobile is required'),
  email: z.string().email().optional().or(z.literal('')),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'], {
    errorMap: () => ({ message: 'customerType must be RETAIL, WHOLESALE, or DISTRIBUTOR' })
  }),
  address: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  notes: z.string().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial().extend({
  followUpDate: z.string().datetime().optional(), // ISO string
});

// Roles: ADMIN and SALES can create/edit. ADMIN, SALES, WAREHOUSE, ACCOUNTS can view.
const readRoles = ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as const;
const writeRoles = ['ADMIN', 'SALES'] as const;

// GET /customers
router.get('/', authenticate, authorize(...readRoles), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const status = req.query.status as any;
    const customerType = req.query.customerType as any;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (customerType) where.customerType = customerType;

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
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

// GET /customers/:id
router.get('/:id', authenticate, authorize(...readRoles), async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
    });
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /customers
router.post('/', authenticate, authorize(...writeRoles), async (req, res) => {
  try {
    const validatedData = createCustomerSchema.safeParse(req.body);
    if (!validatedData.success) {
      res.status(400).json({ error: 'Validation failed', details: validatedData.error.errors });
      return;
    }

    const customer = await prisma.customer.create({
      data: validatedData.data,
    });
    res.status(201).json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /customers/:id
router.put('/:id', authenticate, authorize(...writeRoles), async (req, res) => {
  try {
    const validatedData = updateCustomerSchema.safeParse(req.body);
    if (!validatedData.success) {
      res.status(400).json({ error: 'Validation failed', details: validatedData.error.errors });
      return;
    }

    // Check if exists
    const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const updateData: any = { ...validatedData.data };
    if (updateData.followUpDate) {
      updateData.followUpDate = new Date(updateData.followUpDate);
    }

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
