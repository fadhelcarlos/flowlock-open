import React from 'react';

export const OrderList = () => {
  const orders = useQuery({
    select: ['order.id', 'order.order_number', 'order.created_at']
  });

  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>
          {order.order_number} - {order.created_at}
        </div>
      ))}
    </div>
  );
};