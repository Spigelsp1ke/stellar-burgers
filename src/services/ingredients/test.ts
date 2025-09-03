jest.mock('../../utils/burger-api', () => ({ getIngredientsApi: jest.fn() }));

import { configureStore } from '@reduxjs/toolkit';
import type { TIngredient } from '@utils-types';
import {
  ingredientsReducer,
  fetchIngredients,
  selectIngredientsItems,
  selectIngredientsLoading,
  selectIngredientsError
} from './slice';

const { getIngredientsApi } = require('../../utils/burger-api') as {
  getIngredientsApi: jest.Mock;
};

// фикстуры
const sample: TIngredient[] = [
  {
    _id: '1',
    name: 'Булка',
    type: 'bun',
    proteins: 10,
    fat: 5,
    carbohydrates: 20,
    calories: 200,
    price: 100,
    image: 'img',
    image_large: 'img_l',
    image_mobile: 'img_m'
  }
];

type State = {
  items: TIngredient[];
  data: TIngredient[];
  isLoading: boolean;
  error: string | null;
};

const getInitial = (): State => ({
  items: [],
  data: [],
  isLoading: false,
  error: null
});

describe('ingredients reducer (extraReducers)', () => {
  test('pending: isLoading=true и error=null', () => {
    const initial = getInitial();
    const next = ingredientsReducer(initial, { type: fetchIngredients.pending.type });
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
    expect(next.items).toEqual([]);
    expect(next.data).toEqual([]);
  });

  test('fulfilled: кладёт payload в items и data, isLoading=false', () => {
    const loading: State = { ...getInitial(), isLoading: true };
    const next = ingredientsReducer(loading, {
      type: fetchIngredients.fulfilled.type,
      payload: sample
    });
    expect(next.isLoading).toBe(false);
    expect(next.items).toEqual(sample);
    expect(next.data).toEqual(sample);
    expect(next.error).toBeNull();
  });

  test('rejected: пишет error.message, isLoading=false', () => {
    const loading: State = { ...getInitial(), isLoading: true };
    const next = ingredientsReducer(loading, {
      type: fetchIngredients.rejected.type,
      error: { message: 'Request failed' }
    } as any);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('Request failed');
    expect(next.items).toEqual([]);
    expect(next.data).toEqual([]);
  });

  test('rejected: если message отсутствует — дефолтный текст ошибки', () => {
    const loading: State = { ...getInitial(), isLoading: true };
    const next = ingredientsReducer(loading, {
      type: fetchIngredients.rejected.type,
      error: {}
    } as any);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('Не удалось загрузить ингридиенты');
    expect(next.items).toEqual([]);
    expect(next.data).toEqual([]);
  });
});

describe('ingredients selectors', () => {
  const state = {
    ingredients: {
      ...getInitial(),
      items: sample,
      data: sample,
      isLoading: false,
      error: null
    }
  };

  test('selectIngredientsItems возвращает items', () => {
    expect(selectIngredientsItems(state)).toEqual(sample);
  });

  test('selectIngredientsLoading возвращает isLoading', () => {
    expect(selectIngredientsLoading(state)).toBe(false);
  });

  test('selectIngredientsError возвращает error', () => {
    expect(selectIngredientsError(state)).toBeNull();
  });
});

describe('fetchIngredients thunk — интеграция', () => {
  afterEach(() => jest.clearAllMocks());

  test('успех: кладёт payload в items/data и снимает isLoading', async () => {
    getIngredientsApi.mockResolvedValueOnce(sample);

    const store = configureStore({
      reducer: { ingredients: ingredientsReducer }
    });

    const promise = store.dispatch(fetchIngredients());
    expect(selectIngredientsLoading(store.getState())).toBe(true);

    await promise;

    const st = store.getState();
    expect(selectIngredientsLoading(st)).toBe(false);
    expect(selectIngredientsItems(st)).toEqual(sample);
    expect(selectIngredientsError(st)).toBeNull();
  });

  test('ошибка: пишет message в error и снимает isLoading', async () => {
    getIngredientsApi.mockRejectedValueOnce(new Error('Network down'));

    const store = configureStore({
      reducer: { ingredients: ingredientsReducer }
    });

    const promise = store.dispatch(fetchIngredients());
    expect(selectIngredientsLoading(store.getState())).toBe(true);

    await promise;

    const st = store.getState();
    expect(selectIngredientsLoading(st)).toBe(false);
    expect(selectIngredientsItems(st)).toEqual([]);
    expect(selectIngredientsError(st)).toBe('Network down');
  });
});