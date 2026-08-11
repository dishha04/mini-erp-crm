import prisma from '../src/config/prisma';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Starting seed...');

  // 1. Clear existing data in reverse-dependency order
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create exactly 4 users, one per role
  const saltRounds = 10;
  
  const adminPassword = await bcrypt.hash('Admin@123', saltRounds);
  const salesPassword = await bcrypt.hash('Sales@123', saltRounds);
  const warehousePassword = await bcrypt.hash('Warehouse@123', saltRounds);
  const accountsPassword = await bcrypt.hash('Accounts@123', saltRounds);

  await prisma.user.create({
    data: { name: 'System Admin', email: 'admin@erp.test', password: adminPassword, role: 'ADMIN' }
  });
  
  await prisma.user.create({
    data: { name: 'Sales Rep', email: 'sales@erp.test', password: salesPassword, role: 'SALES' }
  });
  
  await prisma.user.create({
    data: { name: 'Warehouse Manager', email: 'warehouse@erp.test', password: warehousePassword, role: 'WAREHOUSE' }
  });
  
  await prisma.user.create({
    data: { name: 'Accounts Officer', email: 'accounts@erp.test', password: accountsPassword, role: 'ACCOUNTS' }
  });

  // 3. Create 3 sample customers with varied customerType and status values
  await prisma.customer.createMany({
    data: [
      {
        name: 'Ramesh Patel',
        mobile: '9876543210',
        email: 'ramesh.patel@example.com',
        businessName: 'Patel Enterprises',
        gstNumber: '24AAAAA0000A1Z5',
        customerType: 'WHOLESALE',
        address: 'MG Road, Ahmedabad, Gujarat',
        status: 'ACTIVE'
      },
      {
        name: 'Anita Sharma',
        mobile: '9123456789',
        customerType: 'RETAIL',
        address: 'Bandra West, Mumbai, Maharashtra',
        status: 'LEAD'
      },
      {
        name: 'Suresh Kumar',
        mobile: '9988776655',
        businessName: 'Kumar Distributors',
        customerType: 'DISTRIBUTOR',
        address: 'Connaught Place, New Delhi',
        status: 'ACTIVE'
      }
    ]
  });

  // 4. Create 5 sample products
  await prisma.product.createMany({
    data: [
      { name: 'Ceiling Fan - 1200mm', sku: 'FAN-1200-WHT', category: 'Electricals', unitPrice: 1550.00, currentStock: 120, minStockAlert: 50, location: 'A-1' },
      { name: 'LED Bulb 9W', sku: 'LED-9W-WHT', category: 'Electricals', unitPrice: 110.00, currentStock: 500, minStockAlert: 100, location: 'A-2' },
      { name: 'Copper Wire 1.5 sq mm (90m)', sku: 'WIRE-CU-1.5', category: 'Cables', unitPrice: 1050.00, currentStock: 40, minStockAlert: 50, location: 'B-1' },
      { name: 'Modular Switch 6A', sku: 'SW-6A-MOD', category: 'Switches', unitPrice: 35.00, currentStock: 1000, minStockAlert: 200, location: 'C-3' },
      { name: 'MCB 32A Double Pole', sku: 'MCB-32A-DP', category: 'Protection', unitPrice: 320.00, currentStock: 15, minStockAlert: 20, location: 'C-4' }
    ]
  });

  // 5. Log a clear summary
  console.log('Seeded 4 users, 3 customers, 5 products');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
