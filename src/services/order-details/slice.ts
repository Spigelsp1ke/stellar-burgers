import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { TOrder } from '@utils-types';
import { getOrderByNumberApi } from '../../utils/burger-api';

type OrderDetailsState = {
  data: TOrder | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: OrderDetailsState = {
  data: null,
  isLoading: false,
  error: null
};

export const fetchOrderByNumber = createAsyncThunk<TOrder, number>(
  'orderDetails/fetchByNumber',
  async (num) => {
    const res = await getOrderByNumberApi(num);
    return res.orders[0];
  }
);

const orderDetailsSlice = createSlice({
  name: 'orderDetails',
  initialState,
  reducers: {
    clear(state) {
      state.data = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderByNumber.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchOrderByNumber.fulfilled,
        (state, a: PayloadAction<TOrder>) => {
          state.isLoading = false;
          state.data = a.payload;
        }
      )
      .addCase(fetchOrderByNumber.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Не удалось получить заказ';
      });
  }
});

export const { clear: clearOrderDetails } = orderDetailsSlice.actions;
export const orderDetailsReducer = orderDetailsSlice.reducer;

export const selectOrderDetails = (st: { orderDetails: OrderDetailsState }) =>
  st.orderDetails.data;
export const selectOrderDetailsLoading = (st: {
  orderDetails: OrderDetailsState;
}) => st.orderDetails.isLoading;
