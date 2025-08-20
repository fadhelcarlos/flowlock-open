import React from 'react';

export const OrderDetail = () => {
  const order = useQuery({
    select: ['order.id', 'order.order_number', 'order.created_at']
  });

  return (
    <div>
      <h1>Order {order.order_number}</h1>
      <p>Created: {order.created_at}</p>
    </div>
  );
};