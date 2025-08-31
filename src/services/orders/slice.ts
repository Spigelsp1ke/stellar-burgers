import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { TOrder } from '@utils-types';
import { getOrdersApi, orderBurgerApi } from '../../utils/burger-api';

type OrdersState = {
  my: TOrder[];
  isLoading: boolean;
  error: string | null;
  lastCreatedOrder: TOrder | null;
};

const initialState: OrdersState = {
  my: [],
  isLoading: false,
  error: null,
  lastCreatedOrder: null
};

export const fetchMyOrders = createAsyncThunk<TOrder[]>(
  'orders/fetchMy',
  async () => await getOrdersApi()
);

export const createOrder = createAsyncThunk<TOrder, string[]>(
  'orders/create',
  async (ingredientIds) => {
    const res = await orderBurgerApi(ingredientIds);
    return res.order;
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    resetLastCreated(state) {
      state.lastCreatedOrder = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchMyOrders.fulfilled,
        (state, action: PayloadAction<TOrder[]>) => {
          state.isLoading = false;
          state.my = action.payload;
        }
      )
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Не удалось загрузить заказы';
      })

      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        createOrder.fulfilled,
        (state, action: PayloadAction<TOrder>) => {
          state.isLoading = false;
          state.lastCreatedOrder = action.payload;
          state.my = [action.payload, ...state.my];
        }
      )
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Не удалось оформить заказ';
      });
  }
});

export const { resetLastCreated } = ordersSlice.actions;
export const ordersReducer = ordersSlice.reducer;

export const selectMyOrders = (state: { orders: OrdersState }) =>
  state.orders.my;
export const selectOrdersLoading = (state: { orders: OrdersState }) =>
  state.orders.isLoading;
export const selectLastCreatedOrder = (state: { orders: OrdersState }) =>
  state.orders.lastCreatedOrder;
