import React from 'react';

interface UserListProps {
  role: 'admin' | 'viewer';
}

interface User {
  id: string; // TODO: entity field user.id - derived from system.uuid
  name: string; // TODO: entity field user.name
  email: string; // TODO: entity field user.email
  role?: string; // TODO: entity field user.role
}

const UserList: React.FC<UserListProps> = ({ role }) => {
  const [uiState, setUiState] = React.useState<'empty' | 'loading' | 'error'>('loading');
  const [users, setUsers] = React.useState<User[]>([]);

  // TODO: Implement data fetching
  // This component reads: user.id, user.name, user.email, user.role

  if (uiState === 'loading') {
    return <div>Loading users...</div>;
  }

  if (uiState === 'error') {
    return <div>Error loading users</div>;
  }

  if (uiState === 'empty') {
    return <div>No users found</div>;
  }

  return (
    <div>
      <h1>User List</h1>
      <div>
        {users.map(user => (
          <div key={user.id}>
            <span>{user.name}</span>
            <span>{user.email}</span>
            <span>{user.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;