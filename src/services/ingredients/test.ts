jest.mock('../../utils/burger-api', () => ({ getIngredientsApi: jest.fn() }));

import { configureStore } from '@reduxjs/toolkit';
import type { TIngredient } from '@utils-types';
import * as api from '../../utils/burger-api';
import {
  ingredientsReducer,
  initialState as ingredientsInitialState,
  fetchIngredients,
  selectIngredientsItems,
  selectIngredientsLoading,
  selectIngredientsError
} from './slice';

const getIngredientsApi = api.getIngredientsApi as jest.MockedFunction<
  typeof api.getIngredientsApi
>;

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

type IngredientsState = typeof ingredientsInitialState;

type RootStateLocal = { ingredients: IngredientsState };

const makeStore = (preloadedState?: Partial<RootStateLocal>) =>
  configureStore({
    reducer: { ingredients: ingredientsReducer },
    preloadedState: preloadedState as RootStateLocal | undefined,
  });

describe('ingredients reducer (extraReducers)', () => {
  test('pending: isLoading=true и error=null', () => {
    const next = ingredientsReducer(ingredientsInitialState, fetchIngredients.pending('req1', undefined));
    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
    expect(next.items).toEqual([]);
    expect(next.data).toEqual([]);
  });

  test('fulfilled: кладёт payload в items и data, isLoading=false', () => {
    const loading: IngredientsState = { ...ingredientsInitialState, isLoading: true };
    const next = ingredientsReducer(loading, fetchIngredients.fulfilled(sample, 'req1', undefined));
    expect(next.isLoading).toBe(false);
    expect(next.items).toEqual(sample);
    expect(next.data).toEqual(sample);
    expect(next.error).toBeNull();
  });

  test('rejected: пишет error.message, isLoading=false', () => {
    const loading: IngredientsState = { ...ingredientsInitialState, isLoading: true };
    const next = ingredientsReducer(loading, fetchIngredients.rejected(new Error('Request failed'), 'req1', undefined));
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('Request failed');
    expect(next.items).toEqual([]);
    expect(next.data).toEqual([]);
  });

  test('rejected: если message отсутствует — дефолтный текст ошибки', () => {
    const loading: IngredientsState = { ...ingredientsInitialState, isLoading: true };
    const base = fetchIngredients.rejected(new Error('x'), 'req1', undefined);
    const noMsgAction: ReturnType<typeof fetchIngredients.rejected> = {
      type: fetchIngredients.rejected.type,
      meta: base.meta,
      payload: undefined,
      error: {}
    };
    const next = ingredientsReducer(loading, noMsgAction);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('Не удалось загрузить ингридиенты');
    expect(next.items).toEqual([]);
    expect(next.data).toEqual([]);
  });
});

describe('ingredients selectors', () => {
  const state = {
    ingredients: {
      ...ingredientsInitialState,
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

    const store = makeStore();

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