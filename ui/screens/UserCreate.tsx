import React from 'react';

interface UserCreateProps {
  role: 'admin' | 'viewer';
  onSubmit?: (data: CreateUserData) => void;
}

interface CreateUserData {
  email: string; // TODO: entity field user.email
  name: string; // TODO: entity field user.name
  role?: string; // TODO: entity field user.role
}

const UserCreate: React.FC<UserCreateProps> = ({ role, onSubmit }) => {
  const [uiState, setUiState] = React.useState<'empty' | 'loading' | 'error'>('empty');
  const [formData, setFormData] = React.useState<CreateUserData>({
    email: '',
    name: '',
    role: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  if (uiState === 'loading') {
    return <div>Creating user...</div>;
  }

  if (uiState === 'error') {
    return <div>Error creating user</div>;
  }

  return (
    <div>
      <h1>Create User</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        <div>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <label htmlFor="role">User Role</label>
          <input
            id="role"
            type="text"
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          />
        </div>
        <button type="submit">Create User</button>
      </form>
    </div>
  );
};

export default UserCreate;