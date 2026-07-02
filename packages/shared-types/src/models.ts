export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
}
