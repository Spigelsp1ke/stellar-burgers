jest.mock('../../utils/burger-api', () => ({
  getOrdersApi: jest.fn(),
  orderBurgerApi: jest.fn(),
}));

import { configureStore } from '@reduxjs/toolkit';
import type { TOrder } from '@utils-types';
import {
  ordersReducer,
  fetchMyOrders,
  createOrder,
  resetLastCreated,
  selectMyOrders,
  selectOrdersLoading,
  selectLastCreatedOrder,
} from './slice';

const { getOrdersApi, orderBurgerApi } = require('../../utils/burger-api') as {
  getOrdersApi: jest.Mock;
  orderBurgerApi: jest.Mock;
};

const order1: TOrder = {
  _id: 'o1',
  number: 101,
  name: 'First',
  status: 'done',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:05:00.000Z',
  ingredients: ['i1', 'i2'],
} as unknown as TOrder;

const order2: TOrder = {
  _id: 'o2',
  number: 102,
  name: 'Second',
  status: 'pending',
  createdAt: '2023-01-02T00:00:00.000Z',
  updatedAt: '2023-01-02T00:05:00.000Z',
  ingredients: ['i3'],
} as unknown as TOrder;

type State = {
  my: TOrder[];
  isLoading: boolean;
  error: string | null;
  lastCreatedOrder: TOrder | null;
};

const getInitial = (): State => ({
  my: [],
  isLoading: false,
  error: null,
  lastCreatedOrder: null,
});

describe('orders reducer — fetchMyOrders', () => {
  test('pending: isLoading=true, error=null', () => {
    const next = ordersReducer(getInitial(), { type: fetchMyOrders.pending.type });
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
    expect(next.my).toEqual([]);
  });

  test('fulfilled: кладёт массив заказов и isLoading=false', () => {
    const afterPending = ordersReducer(getInitial(), { type: fetchMyOrders.pending.type });

    const next = ordersReducer(afterPending, {
        type: fetchMyOrders.fulfilled.type,
        payload: [order1, order2],
    });
    expect(next.isLoading).toBe(false);
    expect(next.my).toEqual([order1, order2]);
    expect(next.error).toBeNull();
  });

  test('rejected: error.message / default и isLoading=false', () => {
    const loading = { ...getInitial(), isLoading: true };
    const withMessage = ordersReducer(loading, {
      type: fetchMyOrders.rejected.type,
      error: { message: 'Fail A' },
    } as any);
    expect(withMessage.isLoading).toBe(false);
    expect(withMessage.error).toBe('Fail A');

    const noMessage = ordersReducer(loading, {
      type: fetchMyOrders.rejected.type,
      error: {},
    } as any);
    expect(noMessage.isLoading).toBe(false);
    expect(noMessage.error).toBe('Не удалось загрузить заказы');
  });
});

describe('orders reducer — createOrder', () => {
  test('pending: isLoading=true, error=null', () => {
    const next = ordersReducer(getInitial(), { type: createOrder.pending.type });
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
  });

  test('fulfilled: lastCreatedOrder устанавливается и заказ добавляется в начало my', () => {
    const start = { ...getInitial(), isLoading: true, my: [order1] };
    const next = ordersReducer(start, {
      type: createOrder.fulfilled.type,
      payload: order2,
    });
    expect(next.isLoading).toBe(false);
    expect(next.lastCreatedOrder).toEqual(order2);
    expect(next.my).toEqual([order2, order1]);
    expect(next.error).toBeNull();
  });

  test('rejected: error.message / default и isLoading=false', () => {
    const loading = { ...getInitial(), isLoading: true };
    const withMessage = ordersReducer(loading, {
      type: createOrder.rejected.type,
      error: { message: 'Fail B' },
    } as any);
    expect(withMessage.isLoading).toBe(false);
    expect(withMessage.error).toBe('Fail B');

    const noMessage = ordersReducer(loading, {
      type: createOrder.rejected.type,
      error: {},
    } as any);
    expect(noMessage.isLoading).toBe(false);
    expect(noMessage.error).toBe('Не удалось оформить заказ');
  });
});

describe('orders reducer — resetLastCreated', () => {
  test('обнуляет lastCreatedOrder', () => {
    const start: State = { ...getInitial(), lastCreatedOrder: order1 };
    const next = ordersReducer(start, resetLastCreated());
    expect(next.lastCreatedOrder).toBeNull();

    expect(next.my).toEqual([]);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBeNull();
  });
});

describe('orders selectors', () => {
  const state = {
    orders: {
      ...getInitial(),
      my: [order1, order2],
      lastCreatedOrder: order2,
    },
  };

  test('selectMyOrders', () => {
    expect(selectMyOrders(state)).toEqual([order1, order2]);
  });

  test('selectOrdersLoading', () => {
    expect(selectOrdersLoading(state)).toBe(false);
  });

  test('selectLastCreatedOrder', () => {
    expect(selectLastCreatedOrder(state)).toEqual(order2);
  });
});

describe('orders thunks — интеграция со стором', () => {
  afterEach(() => jest.clearAllMocks());

  test('fetchMyOrders: успех', async () => {
    getOrdersApi.mockResolvedValueOnce([order1, order2]);

    const store = configureStore({ reducer: { orders: ordersReducer } });

    const p = store.dispatch(fetchMyOrders());
    expect(selectOrdersLoading(store.getState())).toBe(true);

    await p;

    const st = store.getState();
    expect(selectOrdersLoading(st)).toBe(false);
    expect(selectMyOrders(st)).toEqual([order1, order2]);
    expect(selectLastCreatedOrder(st)).toBeNull();
    expect(getOrdersApi).toHaveBeenCalledTimes(1);
  });

  test('fetchMyOrders: ошибка', async () => {
    getOrdersApi.mockRejectedValueOnce(new Error('Network down'));

    const store = configureStore({ reducer: { orders: ordersReducer } });

    await store.dispatch(fetchMyOrders());
    const st = store.getState();
    expect(selectOrdersLoading(st)).toBe(false);
    expect(st.orders.error).toBe('Network down');
    expect(selectMyOrders(st)).toEqual([]);
  });

  test('createOrder: успех — заказ добавляется в начало и сохраняется в lastCreatedOrder', async () => {
    orderBurgerApi.mockResolvedValueOnce({ order: order2 });

    const store = configureStore({
      reducer: { orders: ordersReducer },
      preloadedState: { orders: { ...getInitial(), my: [order1] } },
    });

    const p = store.dispatch(createOrder(['i3']));
    expect(selectOrdersLoading(store.getState())).toBe(true);

    await p;

    const st = store.getState();
    expect(selectOrdersLoading(st)).toBe(false);
    expect(selectMyOrders(st)).toEqual([order2, order1]);
    expect(selectLastCreatedOrder(st)).toEqual(order2);
    expect(orderBurgerApi).toHaveBeenCalledWith(['i3']);
  });

  test('createOrder: ошибка', async () => {
    orderBurgerApi.mockRejectedValueOnce(new Error('Create failed'));

    const store = configureStore({ reducer: { orders: ordersReducer } });

    await store.dispatch(createOrder(['i1', 'i2']));
    const st = store.getState();
    expect(selectOrdersLoading(st)).toBe(false);
    expect(st.orders.error).toBe('Create failed');
    expect(selectMyOrders(st)).toEqual([]);
    expect(selectLastCreatedOrder(st)).toBeNull();
  });
});