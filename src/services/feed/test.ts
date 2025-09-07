jest.mock('../../utils/burger-api', () => ({
  getFeedsApi: jest.fn(),
}));

import { configureStore } from '@reduxjs/toolkit';
import * as api from '../../utils/burger-api';

import type { TOrdersData, TOrder } from '@utils-types';
import {
  feedReducer,
  initialState as feedInitialState,
  fetchFeed,
  selectFeed,
  selectFeedLoading,
  selectFeedError,
} from './slice';

const getFeedsApi = api.getFeedsApi as jest.MockedFunction<typeof api.getFeedsApi>;

const order1: TOrder = {
  _id: 'id1',
  number: 1001,
  name: 'Order 1',
  status: 'done',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:10:00.000Z',
  ingredients: ['i1', 'i2'],
};

const order2: TOrder = {
  _id: 'id2',
  number: 1002,
  name: 'Order 2',
  status: 'pending',
  createdAt: '2023-01-02T00:00:00.000Z',
  updatedAt: '2023-01-02T00:05:00.000Z',
  ingredients: ['i3'],
};

const sampleFeed: TOrdersData = {
  orders: [order1, order2],
  total: 5000,
  totalToday: 50,
};

type FeedRootState = { feed: typeof feedInitialState };
const makeStore = (preloadedState?: Partial<FeedRootState>) =>
  configureStore({
    reducer: { feed: feedReducer },
    preloadedState: preloadedState as FeedRootState | undefined,
  });

type TFeedsResponse = { success: boolean } & TOrdersData;

describe('feed reducer — pending/fulfilled/rejected', () => {
  test('pending: isLoading=true, error=null', () => {
    const next = feedReducer(feedInitialState, fetchFeed.pending('req1', undefined));
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
    expect(next.data).toBeNull();
  });

  test('fulfilled: data=payload, isLoading=false', () => {
    const afterPending = feedReducer(feedInitialState, fetchFeed.pending('req1', undefined));
    const next = feedReducer(afterPending, fetchFeed.fulfilled(sampleFeed, 'req1', undefined));
    expect(next.isLoading).toBe(false);
    expect(next.data).toEqual(sampleFeed);
    expect(next.error).toBeNull();
  });

  test('rejected: error.message -> error, isLoading=false', () => {
    const loading = { ...feedInitialState, isLoading: true };
    const next = feedReducer(loading, fetchFeed.rejected(new Error('Feed failed'), 'req1', undefined));
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('Feed failed');
    expect(next.data).toBeNull();
  });

  test('rejected: без message — дефолтное сообщение', () => {
    const loading = { ...feedInitialState, isLoading: true };
    const base = fetchFeed.rejected(new Error('x'), 'req1', undefined);
    const noMsgAction: ReturnType<typeof fetchFeed.rejected> = {
      type: fetchFeed.rejected.type,
      meta: base.meta,
      payload: undefined,
      error: {}
    };
    const next = feedReducer(loading, noMsgAction);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('Не удалось загрузить ингридиенты');
    expect(next.data).toBeNull();
  });
});

describe('feed selectors', () => {
  const state: FeedRootState = {
    feed: {
      ...feedInitialState,
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
    const apiResp: TFeedsResponse = { success: true, ...sampleFeed };
    getFeedsApi.mockResolvedValueOnce(apiResp);

    const store = makeStore();

    const p = store.dispatch(fetchFeed());
    expect(selectFeedLoading(store.getState())).toBe(true);

    await p;

    const st = store.getState();
    expect(selectFeedLoading(st)).toBe(false);
    expect(selectFeed(st)).toEqual(apiResp);
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
