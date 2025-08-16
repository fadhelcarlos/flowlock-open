import React from 'react';

interface UserCreatedProps {
  role: 'admin' | 'viewer';
}

const UserCreated: React.FC<UserCreatedProps> = ({ role }) => {
  const [uiState, setUiState] = React.useState<'empty' | 'loading' | 'error'>('empty');

  if (uiState === 'loading') {
    return <div>Loading...</div>;
  }

  if (uiState === 'error') {
    return <div>Error occurred</div>;
  }

  return (
    <div>
      <h1>User Created Successfully</h1>
      <p>The user has been created successfully.</p>
      {/* TODO: Add navigation to user detail or user list */}
    </div>
  );
};

export default UserCreated;