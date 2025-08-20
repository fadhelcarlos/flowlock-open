import React from 'react';

export const UserDetail = () => {
  const user = useQuery({
    select: ['user.id', 'user.name', 'user.email', 'user.role', 'user.created_at']
  });

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <p>{user.role}</p>
      <p>{user.created_at}</p>
    </div>
  );
};