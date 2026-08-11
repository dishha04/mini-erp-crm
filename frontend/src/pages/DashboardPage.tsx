import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome back, {user?.name || user?.userId}! Your role is: <strong>{user?.role}</strong></p>
    </div>
  );
}
