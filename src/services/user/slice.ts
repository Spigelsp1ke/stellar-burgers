import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { TUser } from '@utils-types';
import {
  registerUserApi,
  type TRegisterData,
  loginUserApi,
  type TLoginData,
  getUserApi,
  updateUserApi,
  logoutApi
} from '../../utils/burger-api';
import { setCookie } from '../../utils/cookie';

type UserState = {
  data: TUser | null;
  isLoading: boolean;
  isAuthChecked: boolean;
  error: string | null;
};

const initialState: UserState = {
  data: null,
  isLoading: false,
  isAuthChecked: false,
  error: null
};

export const registerUser = createAsyncThunk<TUser, TRegisterData>(
  'user/register',
  async (payload) => {
    const res = await registerUserApi(payload);
    localStorage.setItem('refreshToken', res.refreshToken);
    setCookie('accessToken', res.accessToken);
    return res.user;
  }
);

export const loginUser = createAsyncThunk<TUser, TLoginData>(
  'user/login',
  async (payload) => {
    const res = await loginUserApi(payload);
    localStorage.setItem('refreshToken', res.refreshToken);
    setCookie('accessToken', res.accessToken);
    return res.user;
  }
);

export const fetchUser = createAsyncThunk<TUser>('user/fetch', async () => {
  const res = await getUserApi();
  return res.user;
});

export const updateUser = createAsyncThunk<TUser, Partial<TRegisterData>>(
  'user/update',
  async (data) => {
    const res = await updateUserApi(data);
    return res.user;
  }
);

export const logout = createAsyncThunk<void>('user/logout', async () => {
  await logoutApi();
  localStorage.removeItem('refreshToken');
  setCookie('accessToken', '', { expires: -1 });
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    authChecked(state, action: PayloadAction<boolean>) {
      state.isAuthChecked = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
        state.isAuthChecked = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Ошибка регистрации';
        state.isAuthChecked = true;
      })

      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
        state.isAuthChecked = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Ошибка авторизации';
        state.isAuthChecked = true;
      })

      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
        state.isAuthChecked = true;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message ?? 'Не удалось получить пользователя';
        state.isAuthChecked = true;
      })

      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Не удалось обновить профиль';
      })

      .addCase(logout.fulfilled, (state) => {
        state.data = null;
        state.isAuthChecked = true;
      });
  }
});

export const { authChecked } = userSlice.actions;
export const userReducer = userSlice.reducer;

export const selectUser = (state: { user: UserState }) => state.user.data;
export const selectUserLoading = (state: { user: UserState }) =>
  state.user.isLoading;
export const selectIsAuthChecked = (state: { user: UserState }) =>
  state.user.isAuthChecked;
