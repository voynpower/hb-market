import type {
  Address,
  AdminDashboard,
  AuthResponse,
  Cart,
  Order,
  Product,
  Category,
  UserSummary,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

export function resolveAssetUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const normalized = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${normalized}`;
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, body, ...rest } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isFormData ? body : body,
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const rawMessage =
      typeof data === 'object' && data !== null && 'message' in data
        ? (data as { message?: unknown }).message
        : null;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const api = {
  baseUrl: API_BASE_URL,
  signUp(payload: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    addresses?: Array<{
      recipient_name: string;
      recipient_phone: string;
      zip_code: string;
      address1: string;
      address2?: string;
      is_default?: boolean;
    }>;
  }) {
    return requestJson<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  signIn(payload: { email: string; password: string }) {
    return requestJson<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  adminSignIn(payload: { email: string; password: string }) {
    return requestJson<AuthResponse>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  me(token: string) {
    return requestJson<UserSummary & { addresses?: Address[]; orders?: Order[] }>('/auth/me', {
      token,
    });
  },
  products(status?: string, categoryId?: string, search?: string, sort?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (categoryId) params.append('category_id', categoryId);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);
    
    const url = params.toString() ? `/products?${params.toString()}` : '/products';
    return requestJson<Product[]>(url);
  },
  product(productId: string) {
    return requestJson<Product>(`/products/${productId}`);
  },
  createProduct(
    token: string,
    payload: {
      category_id?: string;
      name: string;
      description?: string;
      base_price: string;
      status?: string;
      options?: Array<{
        option_name: string;
        option_value: string;
        extra_price?: string;
        stock_qty?: number;
        sku?: string;
      }>;
      images?: Array<{
        url: string;
        alt?: string;
        is_primary?: boolean;
        sort_order?: number;
      }>;
    },
  ) {
    return requestJson<Product>('/products', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },
  updateProduct(
    token: string,
    productId: string,
    payload: {
      category_id?: string;
      name?: string;
      description?: string;
      base_price?: string;
      status?: string;
      options?: Array<{
        option_name: string;
        option_value: string;
        extra_price?: string;
        stock_qty?: number;
        sku?: string;
      }>;
      images?: Array<{
        url: string;
        alt?: string;
        is_primary?: boolean;
        sort_order?: number;
      }>;
    },
  ) {
    return requestJson<Product>(`/products/${productId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    });
  },
  deleteProduct(token: string, productId: string) {
    return requestJson<{ success: true }>(`/products/${productId}`, {
      method: 'DELETE',
      token,
    });
  },
  uploadImage(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return requestJson<{ url: string; filename: string; originalname: string; size: number }>(
      '/files/upload',
      {
        method: 'POST',
        token,
        body: formData,
      },
    );
  },
  getCart(token: string) {
    return requestJson<Cart | null>('/cart/me', { token });
  },
  addCartItem(
    token: string,
    payload: { product_id: string; product_option_id?: string; quantity: number },
  ) {
    return requestJson<Cart>('/cart/items', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },
  updateCartItem(token: string, cartItemId: string, quantity: number) {
    return requestJson<Cart>(`/cart/items/${cartItemId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ quantity }),
    });
  },
  removeCartItem(token: string, cartItemId: string) {
    return requestJson<Cart>(`/cart/items/${cartItemId}`, {
      method: 'DELETE',
      token,
    });
  },
  checkout(
    token: string,
    payload: { address_id: string; payment_method: string; transaction_key?: string },
  ) {
    return requestJson<Order>('/orders/checkout', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },
  myOrders(token: string) {
    return requestJson<Order[]>('/orders/me', { token });
  },
  cancelOrder(token: string, orderId: string) {
    return requestJson<Order>(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
      token,
    });
  },
  allOrders(token: string) {
    return requestJson<Order[]>('/orders', { token });
  },
  updateOrderStatus(
    token: string,
    orderId: string,
    payload: {
      order_status?: string;
      payment_status?: string;
      delivery_status?: string;
      courier?: string;
      tracking_number?: string;
    },
  ) {
    return requestJson<Order>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    });
  },
  addresses(token: string) {
    return requestJson<Address[]>('/addresses', { token });
  },
  createAddress(
    token: string,
    payload: {
      recipient_name: string;
      recipient_phone: string;
      zip_code: string;
      address1: string;
      address2?: string;
      is_default?: boolean;
    },
  ) {
    return requestJson<Address>('/addresses', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },
  updateAddress(
    token: string,
    addressId: string,
    payload: {
      recipient_name?: string;
      recipient_phone?: string;
      zip_code?: string;
      address1?: string;
      address2?: string;
      is_default?: boolean;
    },
  ) {
    return requestJson<Address>(`/addresses/${addressId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    });
  },
  deleteAddress(token: string, addressId: string) {
    return requestJson<{ success: true }>(`/addresses/${addressId}`, {
      method: 'DELETE',
      token,
    });
  },
  adminDashboard(token: string) {
    return requestJson<AdminDashboard>('/admin/dashboard', { token });
  },
  // Category methods
  categories() {
    return requestJson<Category[]>('/categories');
  },
  createCategory(token: string, payload: { name: string; description?: string }) {
    return requestJson<Category>('/categories', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },
  updateCategory(token: string, id: string, payload: { name?: string; description?: string }) {
    return requestJson<Category>(`/categories/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    });
  },
  deleteCategory(token: string, id: string) {
    return requestJson<{ success: true }>(`/categories/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};
