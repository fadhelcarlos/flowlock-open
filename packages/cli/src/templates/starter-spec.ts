export const starterSpec = {
  version: '1.0.0',
  project: 'my-app',
  name: 'My UX Specification',
  description: 'A comprehensive UX specification with all FlowLock features',
  
  // Roles with permissions
  roles: [
    {
      id: 'admin',
      name: 'Administrator',
      permissions: ['create', 'read', 'update', 'delete'],
    },
    {
      id: 'user',
      name: 'User',
      permissions: ['read', 'update:own'],
    },
  ],
  
  // Jobs To Be Done
  jtbd: [
    {
      role: 'admin',
      tasks: [
        'Manage user accounts',
        'Monitor system activity',
        'Configure application settings',
        'View analytics and reports'
      ],
      description: 'Administrative tasks for system management'
    },
    {
      role: 'user',
      tasks: [
        'Browse product catalog',
        'View product details',
        'Manage profile',
        'Track orders'
      ],
      description: 'End-user activities and self-service'
    },
  ],
  
  // Entities with relations
  entities: [
    {
      id: 'user',
      name: 'User',
      fields: [
        { id: 'id', name: 'ID', type: 'string', required: true, derived: true, provenance: 'system.uuid' },
        { id: 'email', name: 'Email', type: 'email', required: true },
        { id: 'name', name: 'Name', type: 'string', required: true },
        { id: 'role', name: 'Role', type: 'enum', enum: ['admin', 'user'], required: true },
        { id: 'avatar', name: 'Avatar', type: 'url', external: true, source: 'gravatar' },
        { id: 'createdAt', name: 'Created At', type: 'date', derived: true, provenance: 'system.timestamp' },
        { id: 'updatedAt', name: 'Updated At', type: 'date', derived: true, provenance: 'system.timestamp' },
      ],
      relations: [
        { id: 'orders', to: 'order', kind: '1:many' },
        { id: 'profile', to: 'profile', kind: '1:1' },
      ],
    },
    {
      id: 'product',
      name: 'Product',
      fields: [
        { id: 'id', name: 'ID', type: 'string', required: true, derived: true, provenance: 'system.uuid' },
        { id: 'name', name: 'Name', type: 'string', required: true },
        { id: 'description', name: 'Description', type: 'text' },
        { id: 'price', name: 'Price', type: 'number', required: true, min: 0 },
        { id: 'stock', name: 'Stock', type: 'number', external: true, source: 'inventory.api' },
        { id: 'category', name: 'Category', type: 'string' },
        { id: 'image', name: 'Image', type: 'url' },
      ],
      relations: [
        { id: 'orders', to: 'order', kind: 'many:many' },
        { id: 'category_ref', to: 'category', kind: 'many:1' },
      ],
    },
    {
      id: 'order',
      name: 'Order',
      fields: [
        { id: 'id', name: 'ID', type: 'string', required: true, derived: true, provenance: 'system.uuid' },
        { id: 'userId', name: 'User ID', type: 'string', required: true },
        { id: 'total', name: 'Total', type: 'number', required: true, derived: true, provenance: 'sum(items.price)' },
        { id: 'status', name: 'Status', type: 'enum', enum: ['draft', 'submitted', 'processing', 'shipped', 'delivered'] },
        { id: 'createdAt', name: 'Created At', type: 'date', derived: true, provenance: 'system.timestamp' },
      ],
      relations: [
        { id: 'user', to: 'user', kind: 'many:1' },
        { id: 'products', to: 'product', kind: 'many:many' },
      ],
    },
  ],
  
  // Enhanced screens with all components
  screens: [
    // Dashboard/Home
    {
      id: 'dashboard',
      name: 'Dashboard',
      type: 'dashboard',
      routes: ['/', '/dashboard'],
      roles: ['admin', 'user'],
      cards: [
        {
          id: 'user_stats',
          title: 'User Statistics',
          reads: ['user.count', 'user.active', 'user.new'],
        },
        {
          id: 'order_stats',
          title: 'Order Summary',
          reads: ['order.count', 'order.revenue', 'order.pending'],
        },
      ],
      ctas: [
        { id: 'view_users', label: 'View Users', to: 'user_list', type: 'primary' },
        { id: 'view_products', label: 'Browse Products', to: 'product_list', type: 'secondary' },
      ],
      uiStates: ['empty', 'loading', 'error'],
    },
    
    // User screens
    {
      id: 'user_list',
      name: 'User List',
      type: 'list',
      entityId: 'user',
      routes: ['/users', '/admin/users'],
      roles: ['admin'],
      lists: [
        {
          id: 'user_table',
          entityId: 'user',
          reads: ['user.id', 'user.name', 'user.email', 'user.role', 'user.createdAt'],
          sortable: true,
          filterable: true,
          paginated: true,
        },
      ],
      ctas: [
        { id: 'create_user', label: 'Add User', to: 'user_create', type: 'primary', icon: 'plus' },
        { id: 'back_home', label: 'Back', to: 'dashboard', type: 'link' },
      ],
      uiStates: ['empty', 'loading', 'error'],
    },
    {
      id: 'user_detail',
      name: 'User Detail',
      type: 'detail',
      entityId: 'user',
      routes: ['/users/:id'],
      roles: ['admin'],
      cards: [
        {
          id: 'user_info',
          entityId: 'user',
          title: 'User Information',
          reads: ['user.id', 'user.name', 'user.email', 'user.role', 'user.avatar', 'user.createdAt', 'user.updatedAt'],
        },
      ],
      lists: [
        {
          id: 'user_orders',
          entityId: 'order',
          reads: ['order.id', 'order.total', 'order.status', 'order.createdAt'],
          sortable: true,
        },
      ],
      ctas: [
        { id: 'edit_user', label: 'Edit', to: 'user_edit', type: 'primary' },
        { id: 'delete_user', label: 'Delete', to: 'user_delete', type: 'secondary' },
        { id: 'back_list', label: 'Back to List', to: 'user_list', type: 'link' },
      ],
      uiStates: ['empty', 'loading', 'error'],
    },
    {
      id: 'user_create',
      name: 'Create User',
      type: 'form',
      entityId: 'user',
      routes: ['/users/new'],
      roles: ['admin'],
      forms: [
        {
          id: 'create_user_form',
          entityId: 'user',
          type: 'create',
          writes: ['user.email', 'user.name', 'user.role'],
          fields: [
            { fieldId: 'email', label: 'Email Address', placeholder: 'user@example.com', validation: { required: true, email: true } },
            { fieldId: 'name', label: 'Full Name', placeholder: 'John Doe', validation: { required: true, minLength: 2 } },
            { fieldId: 'role', label: 'User Role', validation: { required: true } },
          ],
        },
      ],
      ctas: [
        { id: 'cancel', label: 'Cancel', to: 'user_list', type: 'link' },
      ],
      uiStates: ['loading', 'error'],
    },
    {
      id: 'user_success',
      name: 'User Created',
      type: 'success',
      routes: ['/users/success'],
      roles: ['admin'],
      ctas: [
        { id: 'view_user', label: 'View User', to: 'user_detail', type: 'primary' },
        { id: 'create_another', label: 'Create Another', to: 'user_create', type: 'secondary' },
        { id: 'back_list', label: 'Back to List', to: 'user_list', type: 'link' },
      ],
      uiStates: [],
    },
    
    // Product screens
    {
      id: 'product_list',
      name: 'Product Catalog',
      type: 'list',
      entityId: 'product',
      routes: ['/products', '/catalog'],
      roles: ['user', 'admin'],
      lists: [
        {
          id: 'product_grid',
          entityId: 'product',
          reads: ['product.id', 'product.name', 'product.price', 'product.stock', 'product.image'],
          sortable: true,
          filterable: true,
          paginated: true,
        },
      ],
      ctas: [
        { id: 'view_details', label: 'View Details', to: 'product_detail', type: 'primary' },
        { id: 'back_home', label: 'Home', to: 'dashboard', type: 'link' },
      ],
      uiStates: ['empty', 'loading', 'error'],
    },
    {
      id: 'product_detail',
      name: 'Product Detail',
      type: 'detail',
      entityId: 'product',
      routes: ['/products/:id'],
      roles: ['user', 'admin'],
      cards: [
        {
          id: 'product_info',
          entityId: 'product',
          title: 'Product Information',
          reads: ['product.id', 'product.name', 'product.description', 'product.price', 'product.stock', 'product.category', 'product.image'],
        },
      ],
      ctas: [
        { id: 'add_to_cart', label: 'Add to Cart', to: 'cart', type: 'primary' },
        { id: 'back_catalog', label: 'Back to Catalog', to: 'product_list', type: 'link' },
      ],
      uiStates: ['empty', 'loading', 'error'],
    },
    
    // Error screen
    {
      id: 'error',
      name: 'Error',
      type: 'error',
      routes: ['/error'],
      roles: ['admin', 'user'],
      ctas: [
        { id: 'go_home', label: 'Go Home', to: 'dashboard', type: 'primary' },
        { id: 'go_back', label: 'Go Back', to: 'dashboard', type: 'link' },
      ],
      uiStates: [],
    },
  ],
  
  // Enhanced flows with JTBD links
  flows: [
    {
      id: 'create_user_flow',
      name: 'Create User Flow',
      jtbd: 'admin',
      role: 'admin',
      entryStepId: 'step_1',
      steps: [
        {
          id: 'step_1',
          screen: 'user_list',
          reads: ['user.*'],
          next: [{ targetStepId: 'step_2' }],
        },
        {
          id: 'step_2',
          screen: 'user_create',
          writes: ['user.email', 'user.name', 'user.role'],
          next: [{ targetStepId: 'step_3' }],
        },
        {
          id: 'step_3',
          screen: 'user_success',
          next: [{ targetStepId: 'step_4' }],
        },
        {
          id: 'step_4',
          screen: 'user_detail',
          reads: ['user.*'],
        },
      ],
      success: {
        screen: 'user_detail',
        message: 'User successfully created and viewing details',
      },
    },
    {
      id: 'browse_products_flow',
      name: 'Browse Products',
      jtbd: 'user',
      roles: ['user', 'admin'],
      entryStepId: 'browse_1',
      steps: [
        {
          id: 'browse_1',
          screen: 'product_list',
          reads: ['product.*'],
          next: [{ targetStepId: 'browse_2' }],
        },
        {
          id: 'browse_2',
          screen: 'product_detail',
          reads: ['product.*'],
        },
      ],
      success: {
        screen: 'product_detail',
        message: 'Product details viewed',
      },
    },
  ],
  
  // State machines
  states: [
    {
      entity: 'order',
      allowed: ['draft', 'submitted', 'processing', 'shipped', 'delivered', 'cancelled'],
      initial: 'draft',
      terminal: ['delivered', 'cancelled'],
      transitions: [
        { from: 'draft', to: 'submitted', trigger: 'submit' },
        { from: 'submitted', to: 'processing', trigger: 'approve' },
        { from: 'processing', to: 'shipped', trigger: 'ship' },
        { from: 'shipped', to: 'delivered', trigger: 'deliver' },
        { from: 'draft', to: 'cancelled', trigger: 'cancel' },
        { from: 'submitted', to: 'cancelled', trigger: 'cancel' },
      ],
    },
    {
      entity: 'user',
      allowed: ['pending', 'active', 'suspended', 'deactivated'],
      initial: 'pending',
      terminal: ['deactivated'],
      transitions: [
        { from: 'pending', to: 'active', trigger: 'verify' },
        { from: 'active', to: 'suspended', trigger: 'suspend' },
        { from: 'suspended', to: 'active', trigger: 'reactivate' },
        { from: 'active', to: 'deactivated', trigger: 'deactivate' },
        { from: 'suspended', to: 'deactivated', trigger: 'deactivate' },
      ],
    },
  ],
  
  // Enhanced policies
  policies: [
    {
      id: 'auth_required',
      name: 'Authentication Required',
      type: 'security',
      rule: 'All screens except login require authentication',
      severity: 'error',
      enabled: true,
    },
    {
      id: 'email_unique',
      name: 'Email Uniqueness',
      type: 'validation',
      rule: 'User email must be unique across the system',
      severity: 'error',
      enabled: true,
    },
    {
      id: 'three_click_rule',
      name: 'Three Click Rule',
      type: 'ux',
      rule: 'Any screen should be reachable within 3 clicks from home',
      severity: 'warning',
      enabled: true,
      config: { maxClicks: 3 },
    },
    {
      id: 'require_ui_states',
      name: 'UI States Required',
      type: 'ux',
      rule: 'All list and detail screens must handle empty, loading, and error states',
      severity: 'error',
      enabled: true,
    },
  ],
  
  // Glossary entries
  glossary: [
    {
      term: 'system.uuid',
      definition: 'System-generated unique identifier',
      formula: 'crypto.randomUUID()',
      tags: ['system', 'identifier'],
    },
    {
      term: 'system.timestamp',
      definition: 'System-generated timestamp',
      formula: 'new Date().toISOString()',
      tags: ['system', 'datetime'],
    },
    {
      term: 'gravatar',
      definition: 'User avatar from Gravatar service',
      source: 'https://gravatar.com/avatar/{emailHash}',
      tags: ['external', 'image'],
    },
    {
      term: 'inventory.api',
      definition: 'External inventory management system',
      source: 'https://api.inventory.com/v1/stock/{productId}',
      tags: ['external', 'realtime'],
    },
  ],
};