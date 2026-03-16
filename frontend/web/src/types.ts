export type UserSummary = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  status: string;
  subject_type: 'USER' | 'ADMIN';
  created_at?: string;
  updated_at?: string;
};

export type Address = {
  id: string;
  recipient_name: string;
  recipient_phone: string;
  zip_code: string;
  address1: string;
  address2?: string | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProductOption = {
  id: string;
  option_name: string;
  option_value: string;
  extra_price: string;
  stock_qty: number;
  sku?: string | null;
};

export type ProductImage = {
  id: string;
  url: string;
  alt?: string | null;
  is_primary: boolean;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  base_price: string;
  status: string;
  created_at: string;
  updated_at: string;
  product_images: ProductImage[];
  product_options: ProductOption[];
  categories?: Category | null;
};

export type CartItem = {
  id: string;
  product_id: string;
  product_option_id?: string | null;
  quantity: number;
  unit_price: string;
  products: {
    id: string;
    name: string;
    status: string;
    base_price: string;
    product_images?: ProductImage[];
  };
  product_options?: ProductOption | null;
};

export type Cart = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  cart_items: CartItem[];
};

export type Payment = {
  id: string;
  payment_method: string;
  payment_status: string;
  amount: string;
  transaction_key?: string | null;
  paid_at?: string | null;
};

export type Shipment = {
  id: string;
  shipment_status: string;
  courier?: string | null;
  tracking_number?: string | null;
};

export type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  option_name?: string | null;
  option_value?: string | null;
  quantity: number;
  unit_price: string;
  total_price: string;
  products?: {
    product_images: Array<{ url: string; alt?: string | null }>;
  };
};

export type Order = {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  delivery_status: string;
  total_amount: string;
  created_at: string;
  updated_at?: string;
  users?: UserSummary;
  addresses?: Address;
  order_items: OrderItem[];
  payments?: Payment | null;
  shipments?: Shipment | null;
};

export type AuthResponse = {
  user: UserSummary & { addresses?: Address[] };
  access_token: string;
};

export type AdminDashboard = {
  metrics: {
    users: number;
    products: number;
    orders: number;
    paid_revenue: string;
  };
  recent_orders: Order[];
};
