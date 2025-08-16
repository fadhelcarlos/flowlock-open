import React from 'react';

interface UserDetailProps {
  role: 'admin' | 'viewer';
  userId: string;
}

interface User {
  id: string; // TODO: entity field user.id - derived from system.uuid
  name: string; // TODO: entity field user.name
  email: string; // TODO: entity field user.email
  role?: string; // TODO: entity field user.role
  createdAt: string; // TODO: entity field user.createdAt - derived from system.timestamp
}

const UserDetail: React.FC<UserDetailProps> = ({ role, userId }) => {
  const [uiState, setUiState] = React.useState<'empty' | 'loading' | 'error'>('loading');
  const [user, setUser] = React.useState<User | null>(null);

  // TODO: Implement data fetching for userId
  // This component reads: user.id, user.name, user.email, user.role, user.createdAt

  if (uiState === 'loading') {
    return <div>Loading user details...</div>;
  }

  if (uiState === 'error') {
    return <div>Error loading user details</div>;
  }

  if (uiState === 'empty' || !user) {
    return <div>User not found</div>;
  }

  return (
    <div>
      <h1>User Detail</h1>
      <div>
        <div>ID: {user.id}</div>
        <div>Name: {user.name}</div>
        <div>Email: {user.email}</div>
        <div>Role: {user.role}</div>
        <div>Created: {user.createdAt}</div>
      </div>
    </div>
  );
};

export default UserDetail;