jest.mock('../../utils/burger-api', () => ({
  getFeedsApi: jest.fn(),
}));

import { configureStore } from '@reduxjs/toolkit';
import type { TOrdersData, TOrder } from '@utils-types';
import {
  feedReducer,
  fetchFeed,
  selectFeed,
  selectFeedLoading,
  selectFeedError,
} from './slice';

const { getFeedsApi } = require('../../utils/burger-api') as {
  getFeedsApi: jest.Mock;
}

const order1: TOrder = {
  _id: 'id1',
  number: 1001,
  name: 'Order 1',
  status: 'done',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:10:00.000Z',
  ingredients: ['i1', 'i2'],
} as unknown as TOrder;

const order2: TOrder = {
  _id: 'id2',
  number: 1002,
  name: 'Order 2',
  status: 'pending',
  createdAt: '2023-01-02T00:00:00.000Z',
  updatedAt: '2023-01-02T00:05:00.000Z',
  ingredients: ['i3'],
} as unknown as TOrder;

const sampleFeed: TOrdersData = {
  orders: [order1, order2],
  total: 5000,
  totalToday: 50,
} as unknown as TOrdersData;

type FeedState = {
  data: TOrdersData | null;
  isLoading: boolean;
  error: string | null;
};
type RootState = { feed: FeedState };

const getInitial = (): FeedState => ({
  data: null,
  isLoading: false,
  error: null,
});

const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: { feed: feedReducer },
    preloadedState: preloadedState as RootState | undefined,
  });

describe('feed reducer — pending/fulfilled/rejected', () => {
  test('pending: isLoading=true, error=null', () => {
    const next = feedReducer(getInitial(), { type: fetchFeed.pending.type });
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
    expect(next.data).toBeNull();
  });

  test('fulfilled: data=payload, isLoading=false', () => {
    const afterPending = feedReducer(getInitial(), { type: fetchFeed.pending.type });
    const next = feedReducer(afterPending, {
      type: fetchFeed.fulfilled.type,
      payload: sampleFeed,
    });
    expect(next.isLoading).toBe(false);
    expect(next.data).toEqual(sampleFeed);
    expect(next.error).toBeNull();
  });

  test('rejected: error.message -> error, isLoading=false', () => {
    const loading = { ...getInitial(), isLoading: true };
    const next = feedReducer(loading, {
      type: fetchFeed.rejected.type,
      error: { message: 'Feed failed' },
    } as any);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('Feed failed');
    expect(next.data).toBeNull();
  });

  test('rejected: без message — дефолтное сообщение', () => {
    const loading = { ...getInitial(), isLoading: true };
    const next = feedReducer(loading, {
      type: fetchFeed.rejected.type,
      error: {},
    } as any);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('Не удалось загрузить ингридиенты');
    expect(next.data).toBeNull();
  });
});

describe('feed selectors', () => {
  const state: RootState = {
    feed: {
      ...getInitial(),
      data: sampleFeed,
      isLoading: false,
      error: null,
    },
  };

  test('selectFeed возвращает data', () => {
    expect(selectFeed(state)).toEqual(sampleFeed);
  });

  test('selectFeedLoading возвращает isLoading', () => {
    expect(selectFeedLoading(state)).toBe(false);
  });

  test('selectFeedError возвращает error', () => {
    expect(selectFeedError(state)).toBeNull();
  });
});

describe('fetchFeed thunk — интеграция со стором', () => {
  afterEach(() => jest.clearAllMocks());

  test('успех: кладёт payload в data, снимает isLoading', async () => {
    getFeedsApi.mockResolvedValueOnce(sampleFeed);

    const store = makeStore();

    const p = store.dispatch(fetchFeed());
    expect(selectFeedLoading(store.getState())).toBe(true); // pending

    await p;

    const st = store.getState();
    expect(selectFeedLoading(st)).toBe(false);
    expect(selectFeed(st)).toEqual(sampleFeed);
    expect(selectFeedError(st)).toBeNull();
    expect(getFeedsApi).toHaveBeenCalledTimes(1);
  });

  test('ошибка: пишет message в error и снимает isLoading', async () => {
    getFeedsApi.mockRejectedValueOnce(new Error('Network down'));

    const store = makeStore();

    await store.dispatch(fetchFeed());
    const st = store.getState();
    expect(selectFeedLoading(st)).toBe(false);
    expect(selectFeed(st)).toBeNull();
    expect(selectFeedError(st)).toBe('Network down');
    expect(getFeedsApi).toHaveBeenCalledTimes(1);
  });
});
