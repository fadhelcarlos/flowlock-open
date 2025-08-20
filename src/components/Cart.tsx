import React from 'react';

export const Cart = () => {
  const cart = useQuery({
    select: ['cart.id']
  });

  return (
    <div>
      <h1>Shopping Cart</h1>
      <p>Cart ID: {cart.id}</p>
    </div>
  );
};