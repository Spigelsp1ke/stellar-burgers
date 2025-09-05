jest.mock('../../utils/burger-api', () => ({ getOrderByNumberApi: jest.fn() }));

import { configureStore } from '@reduxjs/toolkit';
import * as api from '../../utils/burger-api';
import type { TOrder } from '@utils-types';
import {
  orderDetailsReducer,
  initialState as orderDetailsInitialState,
  fetchOrderByNumber,
  clearOrderDetails,
  selectOrderDetails,
  selectOrderDetailsLoading
} from './slice';

const getOrderByNumberApi = api.getOrderByNumberApi as jest.MockedFunction<
  typeof api.getOrderByNumberApi
>;

type TOrderResponse = { success: boolean; orders: TOrder[] };

const order: TOrder = {
  _id: 'order-id-1',
  number: 1234,
  name: 'Space бургер',
  status: 'done',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:10:00.000Z',
  ingredients: ['ing-1', 'ing-2']
} as unknown as TOrder;

type OrderDetailsState = typeof orderDetailsInitialState;
type RootLocal = { orderDetails: OrderDetailsState };

const makeStore = (preloadedState?: Partial<RootLocal>) =>
  configureStore({
    reducer: { orderDetails: orderDetailsReducer },
    preloadedState: preloadedState as RootLocal | undefined,
  });

describe('order-details reducer', () => {
  test('pending: isLoading=true и error=null', () => {
    const next = orderDetailsReducer(orderDetailsInitialState, fetchOrderByNumber.pending('req1', 1234));
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
    expect(next.data).toBeNull();
  });

  test('fulfilled: data = payload и isLoading=false', () => {
    const afterPending = orderDetailsReducer(orderDetailsInitialState, fetchOrderByNumber.pending('req1', 1234));
    const next = orderDetailsReducer(afterPending, fetchOrderByNumber.fulfilled(order, 'req1', 1234));
    expect(next.isLoading).toBe(false);
    expect(next.data).toEqual(order);
    expect(next.error).toBeNull();
  });

  test('rejected: error=message и isLoading=false', () => {
    const loading = { ...orderDetailsInitialState, isLoading: true };
    const next = orderDetailsReducer(loading, fetchOrderByNumber.rejected(new Error('Order not found'), 'req1', 1234));
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('Order not found');
    expect(next.data).toBeNull();
  });

  test('rejected: если message отсутствует — дефолтное сообщение', () => {
    const loading: OrderDetailsState = { ...orderDetailsInitialState, isLoading: true };
    const base = fetchOrderByNumber.rejected(new Error('x'), 'req1', 1234);
    const noMsgAction: ReturnType<typeof fetchOrderByNumber.rejected> = {
      type: fetchOrderByNumber.rejected.type,
      meta: base.meta,
      payload: undefined,
      error: {}
    };
    const next = orderDetailsReducer(loading, noMsgAction);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('Не удалось получить заказ');
    expect(next.data).toBeNull();
  });

  test('clear: обнуляет data и error (isLoading не трогаем)', () => {
    const start: OrderDetailsState = { data: order, isLoading: true, error: 'oops' };
    const next = orderDetailsReducer(start, clearOrderDetails());
    expect(next.data).toBeNull();
    expect(next.error).toBeNull();
    expect(next.isLoading).toBe(true);
  });
});

describe('order-details selectors', () => {
  test('selectOrderDetails возвращает data', () => {
    const state: RootLocal  = { orderDetails: { ...orderDetailsInitialState, data: order } };
    expect(selectOrderDetails(state)).toEqual(order);
  });

  test('selectOrderDetailsLoading возвращает isLoading', () => {
    const state: RootLocal  = { orderDetails: { ...orderDetailsInitialState, isLoading: true } };
    expect(selectOrderDetailsLoading(state)).toBe(true);
  });
});

describe('fetchOrderByNumber thunk — интеграция со стором', () => {
  afterEach(() => jest.clearAllMocks());

  test('успех: кладёт заказ в data и снимает isLoading', async () => {
    const apiResp: TOrderResponse = { success: true, orders: [order] };
    getOrderByNumberApi.mockResolvedValueOnce(apiResp);

    const store = makeStore();

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

    const store = makeStore();

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
