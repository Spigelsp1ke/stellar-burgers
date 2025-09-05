import type { TIngredient, TConstructorIngredient } from '@utils-types';

jest.mock('@reduxjs/toolkit', () => {
  const actual = jest.requireActual('@reduxjs/toolkit');
  const ids = ['uid-1', 'uid-2', 'uid-3'];
  let i = 0;
  return {
    ...actual,
    nanoid: jest.fn(() => ids[i++] ?? `uid-${i}`),
  };
});

import {
  burgerConstructorReducer,
  initialState as constructorInitialState,
  setBun,
  addIngredient,
  removeIngredient,
  moveIngredient,
  clearConstructor,
} from '../../services/burger-constructor/slice';

type ConstructorState = typeof constructorInitialState;

const bun1: TIngredient = {
  _id: 'bun-1',
  name: 'Булка 1',
  type: 'bun',
  proteins: 10,
  fat: 5,
  carbohydrates: 20,
  calories: 200,
  price: 50,
  image: 'img',
  image_large: 'img_l',
  image_mobile: 'img_m',
};

const bun2: TIngredient = {
  _id: 'bun-2',
  name: 'Булка 2',
  type: 'bun',
  proteins: 11,
  fat: 6,
  carbohydrates: 21,
  calories: 210,
  price: 60,
  image: 'img2',
  image_large: 'img2_l',
  image_mobile: 'img2_m',
};

const cheese: TIngredient = {
  _id: 'ing-1',
  name: 'Сыр',
  type: 'main',
  proteins: 1,
  fat: 1,
  carbohydrates: 1,
  calories: 10,
  price: 25,
  image: 'i',
  image_large: 'il',
  image_mobile: 'im',
};

const sauce: TIngredient = {
  _id: 'ing-2',
  name: 'Соус',
  type: 'sauce',
  proteins: 1,
  fat: 1,
  carbohydrates: 1,
  calories: 10,
  price: 15,
  image: 'i2',
  image_large: 'il2',
  image_mobile: 'im2',
};

describe('burger-constructor slice', () => {
  test('setBun: устанавливает булку и заменяет предыдущую', () => {
    let state = burgerConstructorReducer(constructorInitialState, setBun(bun1));
    expect(state.bun?._id).toBe('bun-1');

    state = burgerConstructorReducer(state, setBun(bun2));
    expect(state.bun?._id).toBe('bun-2');
    expect(state.ingredients).toHaveLength(0);
  });

  test('addIngredient: добавляет начинку и проставляет id из prepare(nanoid)', () => {
    let state = burgerConstructorReducer(constructorInitialState, addIngredient(cheese));
    expect(state.ingredients).toHaveLength(1);
    expect(state.ingredients[0]).toEqual(
      expect.objectContaining({
        _id: 'ing-1',
        name: 'Сыр',
        id: 'uid-1',
      })
    );

    state = burgerConstructorReducer(state, addIngredient(sauce));
    expect(state.ingredients).toHaveLength(2);
    expect(state.ingredients[1].id).toBe('uid-2');
  });

  test('removeIngredient: удаляет начинку по id', () => {
    const start: ConstructorState = {
      bun: null,
      ingredients: [
        { ...cheese, id: 'uid-1' },
        { ...sauce, id: 'uid-2' },
      ],
    };

    const next = burgerConstructorReducer(start, removeIngredient('uid-1'));
    expect(next.ingredients).toHaveLength(1);
    expect(next.ingredients[0].id).toBe('uid-2');
  });

  test('moveIngredient: меняет порядок начинок (fromIndex -> toIndex)', () => {
    const start: ConstructorState = {
      bun: bun1,
      ingredients: [
        { ...cheese, id: 'uid-1' },
        { ...sauce, id: 'uid-2' },
      ],
    };

    const next = burgerConstructorReducer(
      start,
      moveIngredient({ fromIndex: 0, toIndex: 1 })
    );

    expect(next.ingredients.map((i) => i.id)).toEqual(['uid-2', 'uid-1']);
    expect(next.bun?._id).toBe('bun-1');
  });

  test('clearConstructor: очищает булку и начинки', () => {
    const start: ConstructorState = {
      bun: bun1,
      ingredients: [{ ...cheese, id: 'uid-1' }],
    };

    const next = burgerConstructorReducer(start, clearConstructor());
    expect(next).toEqual({ bun: null, ingredients: [] });
  });
});