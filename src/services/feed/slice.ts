import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { TOrder, TOrdersData } from '@utils-types';
import { getFeedsApi } from '../../utils/burger-api';

type FeedState = {
  data: TOrdersData | null;
  isLoading: boolean;
  error: string | null;
};

export const initialState: FeedState = {
  data: null,
  isLoading: false,
  error: null
};

export const fetchFeed = createAsyncThunk<TOrdersData>(
  'feed/fetch',
  async () => await getFeedsApi()
);

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchFeed.fulfilled,
        (state, action: PayloadAction<TOrdersData>) => {
          state.isLoading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchFeed.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message ?? 'Не удалось загрузить ингридиенты';
      });
  }
});

export const feedReducer = feedSlice.reducer;

export const selectFeed = (state: { feed: FeedState }) => state.feed.data;
export const selectFeedLoading = (state: { feed: FeedState }) =>
  state.feed.isLoading;
export const selectFeedError = (state: { feed: FeedState }) => state.feed.error;
