import React from 'react';

interface UserDetailProps {
  userId: string;
}

export function UserDetail({ userId }: UserDetailProps) {
  // Demo data - would normally fetch from API
  const user = {
    id: userId,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    createdAt: '2024-01-15T10:30:00Z',
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Detail</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <dl className="space-y-4">
          <div>
            <dt className="font-semibold text-gray-600">ID</dt>
            <dd className="mt-1">{user.id}</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-600">Name</dt>
            <dd className="mt-1">{user.name}</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-600">Email</dt>
            <dd className="mt-1">{user.email}</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-600">Role</dt>
            <dd className="mt-1">{user.role}</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-600">Created At</dt>
            <dd className="mt-1">{new Date(user.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}