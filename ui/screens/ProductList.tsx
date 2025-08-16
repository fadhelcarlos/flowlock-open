import React from 'react';

interface ProductListProps {
  role: 'admin' | 'viewer';
}

interface Product {
  id: string; // TODO: entity field product.id - external from catalog_api
  name: string; // TODO: entity field product.name - external from catalog_api
  price: number; // TODO: entity field product.price - external from catalog_api
  stock?: number; // TODO: entity field product.stock - external from catalog_api
}

const ProductList: React.FC<ProductListProps> = ({ role }) => {
  const [uiState, setUiState] = React.useState<'empty' | 'loading' | 'error'>('loading');
  const [products, setProducts] = React.useState<Product[]>([]);

  // TODO: Implement data fetching from catalog_api
  // This component reads: product.id, product.name, product.price, product.stock

  if (uiState === 'loading') {
    return <div>Loading products...</div>;
  }

  if (uiState === 'error') {
    return <div>Error loading products</div>;
  }

  if (uiState === 'empty') {
    return <div>No products found</div>;
  }

  return (
    <div>
      <h1>Product Catalog</h1>
      <div>
        {products.map(product => (
          <div key={product.id}>
            <span>{product.name}</span>
            <span>${product.price}</span>
            <span>Stock: {product.stock}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;