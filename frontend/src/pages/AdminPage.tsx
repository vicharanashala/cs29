import React from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';

export const AdminPage: React.FC = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <AdminLayout />;
};

export default AdminPage;
