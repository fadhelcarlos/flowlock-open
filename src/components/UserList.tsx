import React from 'react';

export const UserList = () => {
  const users = useQuery({
    select: ['user.id', 'user.name', 'user.email', 'user.role']
  });

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          {user.name} - {user.email} - {user.role}
        </div>
      ))}
    </div>
  );
};