import React from 'react';

interface ProductDetailProps {
  role: 'admin' | 'viewer';
  productId: string;
}

interface Product {
  id: string; // TODO: entity field product.id - external from catalog_api
  name: string; // TODO: entity field product.name - external from catalog_api
  description?: string; // TODO: entity field product.description - external from catalog_api
  price: number; // TODO: entity field product.price - external from catalog_api
  stock?: number; // TODO: entity field product.stock - external from catalog_api
}

const ProductDetail: React.FC<ProductDetailProps> = ({ role, productId }) => {
  const [uiState, setUiState] = React.useState<'empty' | 'loading' | 'error'>('loading');
  const [product, setProduct] = React.useState<Product | null>(null);

  // TODO: Implement data fetching from catalog_api for productId
  // This component reads: product.id, product.name, product.description, product.price, product.stock

  if (uiState === 'loading') {
    return <div>Loading product details...</div>;
  }

  if (uiState === 'error') {
    return <div>Error loading product details</div>;
  }

  if (uiState === 'empty' || !product) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <h1>Product Detail</h1>
      <div>
        <div>ID: {product.id}</div>
        <div>Name: {product.name}</div>
        <div>Description: {product.description}</div>
        <div>Price: ${product.price}</div>
        <div>Stock: {product.stock}</div>
      </div>
    </div>
  );
};

export default ProductDetail;