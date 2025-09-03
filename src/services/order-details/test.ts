jest.mock('../../utils/burger-api', () => ({ getOrderByNumberApi: jest.fn() }));

import { configureStore } from '@reduxjs/toolkit';
import type { TOrder } from '@utils-types';
import {
  orderDetailsReducer,
  fetchOrderByNumber,
  clearOrderDetails,
  selectOrderDetails,
  selectOrderDetailsLoading
} from './slice';

const { getOrderByNumberApi } = require('../../utils/burger-api') as {
  getOrderByNumberApi: jest.Mock;
};

const order: TOrder = {
  _id: 'order-id-1',
  number: 1234,
  name: 'Space бургер',
  status: 'done',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:10:00.000Z',
  ingredients: ['ing-1', 'ing-2']
} as unknown as TOrder;

type State = {
  data: TOrder | null;
  isLoading: boolean;
  error: string | null;
};
const getInitial = (): State => ({
  data: null,
  isLoading: false,
  error: null
});

describe('order-details reducer', () => {
  test('pending: isLoading=true и error=null', () => {
    const initial = getInitial();
    const next = orderDetailsReducer(initial, { type: fetchOrderByNumber.pending.type });
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
    expect(next.data).toBeNull();
  });

  test('fulfilled: data = payload и isLoading=false', () => {
    const afterPending = orderDetailsReducer(getInitial(), { type: fetchOrderByNumber.pending.type });
    const next = orderDetailsReducer(afterPending, {
        type: fetchOrderByNumber.fulfilled.type,
        payload: order,
    });
    expect(next.isLoading).toBe(false);
    expect(next.data).toEqual(order);
    expect(next.error).toBeNull();
  });

  test('rejected: error=message и isLoading=false', () => {
    const loading = { ...getInitial(), isLoading: true };
    const next = orderDetailsReducer(loading, {
      type: fetchOrderByNumber.rejected.type,
      error: { message: 'Order not found' }
    } as any);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('Order not found');
    expect(next.data).toBeNull();
  });

  test('rejected: если message отсутствует — дефолтное сообщение', () => {
    const loading = { ...getInitial(), isLoading: true };
    const next = orderDetailsReducer(loading, {
      type: fetchOrderByNumber.rejected.type,
      error: {}
    } as any);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('Не удалось получить заказ');
    expect(next.data).toBeNull();
  });

  test('clear: обнуляет data и error (isLoading не трогаем)', () => {
    const start: State = { data: order, isLoading: true, error: 'oops' };
    const next = orderDetailsReducer(start, clearOrderDetails());
    expect(next.data).toBeNull();
    expect(next.error).toBeNull();
    expect(next.isLoading).toBe(true); // не изменяем
  });
});

describe('order-details selectors', () => {
  test('selectOrderDetails возвращает data', () => {
    const state = { orderDetails: { ...getInitial(), data: order } };
    expect(selectOrderDetails(state)).toEqual(order);
  });

  test('selectOrderDetailsLoading возвращает isLoading', () => {
    const state = { orderDetails: { ...getInitial(), isLoading: true } };
    expect(selectOrderDetailsLoading(state)).toBe(true);
  });
});

describe('fetchOrderByNumber thunk — интеграция со стором', () => {
  afterEach(() => jest.clearAllMocks());

  test('успех: кладёт заказ в data и снимает isLoading', async () => {
    getOrderByNumberApi.mockResolvedValueOnce({ orders: [order] });

    const store = configureStore({
      reducer: { orderDetails: orderDetailsReducer }
    });

    const promise = store.dispatch(fetchOrderByNumber(1234));
    expect(selectOrderDetailsLoading(store.getState())).toBe(true);
    expect(getOrderByNumberApi).toHaveBeenCalledWith(1234);

    await promise;

    const st = store.getState();
    expect(selectOrderDetailsLoading(st)).toBe(false);
    expect(selectOrderDetails(st)).toEqual(order);
  });

  test('ошибка: пишет message в error и снимает isLoading', async () => {
    getOrderByNumberApi.mockRejectedValueOnce(new Error('Network down'));

    const store = configureStore({
      reducer: { orderDetails: orderDetailsReducer }
    });

    const promise = store.dispatch(fetchOrderByNumber(9999));
    expect(selectOrderDetailsLoading(store.getState())).toBe(true);

    await promise;

    const st = store.getState();
    expect(selectOrderDetailsLoading(st)).toBe(false);
    expect(st.orderDetails.data).toBeNull();
    expect(st.orderDetails.error).toBe('Network down');
    expect(getOrderByNumberApi).toHaveBeenCalledWith(9999);
  });
});
