import React from 'react';
import { AdminPanel } from './AdminPanel';

interface AdminViewProps {
  onCloseAdmin?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onCloseAdmin }) => {
  return (
    <div className="w-full">
      <AdminPanel onCloseAdmin={onCloseAdmin} />
    </div>
  );
};
