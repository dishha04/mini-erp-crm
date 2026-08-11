import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
