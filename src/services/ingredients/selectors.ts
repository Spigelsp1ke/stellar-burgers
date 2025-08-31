import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export const selectIngredientsItems = (state: RootState) =>
  state.ingredients.items;

export const selectBuns = createSelector([selectIngredientsItems], (items) =>
  items.filter((i) => i.type === 'bun')
);
export const selectMains = createSelector([selectIngredientsItems], (items) =>
  items.filter((i) => i.type === 'main')
);
export const selectSauces = createSelector([selectIngredientsItems], (items) =>
  items.filter((i) => i.type === 'sauce')
);
