import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { TIngredient } from '@utils-types';
import { getIngredientsApi } from '../../utils/burger-api';

type IngredientsState = {
  items: TIngredient[];
  data: TIngredient[];
  isLoading: boolean;
  error: string | null;
};

export const initialState: IngredientsState = {
  items: [],
  data: [],
  isLoading: false,
  error: null
};

export const fetchIngredients = createAsyncThunk<TIngredient[]>(
  'ingredients/fetchAll',
  async () => {
    const items = await getIngredientsApi();
    return items;
  }
);

const ingredientsSlice = createSlice({
  name: 'ingredients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIngredients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchIngredients.fulfilled,
        (state, action: PayloadAction<TIngredient[]>) => {
          state.isLoading = false;
          state.items = action.payload;
          state.data = action.payload;
        }
      )
      .addCase(fetchIngredients.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message ?? 'Не удалось загрузить ингридиенты';
      });
  }
});

export const ingredientsReducer = ingredientsSlice.reducer;

export const selectIngredientsItems = (state: {
  ingredients: IngredientsState;
}) => state.ingredients.items;
export const selectIngredientsLoading = (state: {
  ingredients: IngredientsState;
}) => state.ingredients.isLoading;
export const selectIngredientsError = (state: {
  ingredients: IngredientsState;
}) => state.ingredients.error;
