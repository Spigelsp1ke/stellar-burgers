jest.mock('../../utils/burger-api', () => ({
  registerUserApi: jest.fn(),
  loginUserApi: jest.fn(),
  getUserApi: jest.fn(),
  updateUserApi: jest.fn(),
  logoutApi: jest.fn(),
}));
jest.mock('../../utils/cookie', () => ({
  setCookie: jest.fn(),
}));

import { configureStore } from '@reduxjs/toolkit';
import type { TUser } from '@utils-types';
import {
  userReducer,
  authChecked,
  registerUser,
  loginUser,
  fetchUser,
  updateUser,
  logout,
  selectUser,
  selectUserLoading,
  selectIsAuthChecked,
} from './slice';

const {
  registerUserApi,
  loginUserApi,
  getUserApi,
  updateUserApi,
  logoutApi,
} = require('../../utils/burger-api') as {
  registerUserApi: jest.Mock;
  loginUserApi: jest.Mock;
  getUserApi: jest.Mock;
  updateUserApi: jest.Mock;
  logoutApi: jest.Mock;
};
const { setCookie } = require('../../utils/cookie') as { setCookie: jest.Mock };

const user: TUser = { name: 'Alice', email: 'alice@example.com' } as TUser;
const apiAuthResp = (u: TUser) => ({
  user: u,
  accessToken: 'ACCESS.TOKEN',
  refreshToken: 'REFRESH_TOKEN',
});

type UserState = {
  data: TUser | null;
  isLoading: boolean;
  isAuthChecked: boolean;
  error: string | null;
};

type RootState = { user: UserState };

const getInitial = (): UserState => ({
  data: null,
  isLoading: false,
  isAuthChecked: false,
  error: null,
});

const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: { user: userReducer },
    preloadedState: preloadedState as RootState | undefined,
  });

beforeEach(() => {
  jest.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {});
  jest.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation(() => {});
});
afterEach(() => {
  jest.resetAllMocks();
});

describe('user reducer — базовые экшены', () => {
  it('authChecked: ставит флаг', () => {
    const store = makeStore();
    store.dispatch(authChecked(true));
    expect(selectIsAuthChecked(store.getState())).toBe(true);
    store.dispatch(authChecked(false));
    expect(selectIsAuthChecked(store.getState())).toBe(false);
  });

  it('registerUser.pending: isLoading=true, error=null', () => {
    const state = userReducer(getInitial(), { type: registerUser.pending.type });
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('registerUser.fulfilled: сохраняет user и отмечает authChecked', () => {
    const state = userReducer(
      { ...getInitial(), isLoading: true },
      { type: registerUser.fulfilled.type, payload: user }
    );
    expect(state.isLoading).toBe(false);
    expect(state.data).toEqual(user);
    expect(state.isAuthChecked).toBe(true);
    expect(state.error).toBeNull();
  });

  it('registerUser.rejected: пишет message/дефолт, isAuthChecked=true', () => {
    const withMsg = userReducer(
      { ...getInitial(), isLoading: true },
      { type: registerUser.rejected.type, error: { message: 'Reg failed' } } as any
    );
    expect(withMsg.isLoading).toBe(false);
    expect(withMsg.error).toBe('Reg failed');
    expect(withMsg.isAuthChecked).toBe(true);

    const noMsg = userReducer(
      { ...getInitial(), isLoading: true },
      { type: registerUser.rejected.type, error: {} } as any
    );
    expect(noMsg.error).toBe('Ошибка регистрации');
    expect(noMsg.isAuthChecked).toBe(true);
  });
});

describe('user thunks — интеграция со стором', () => {
  it('registerUser: успех — кладёт пользователя, токены и cookie', async () => {
    registerUserApi.mockResolvedValueOnce(apiAuthResp(user));
    const store = makeStore();

    const p = store.dispatch(registerUser({ email: 'a@a.a', name: 'Alice', password: '123' }));
    expect(selectUserLoading(store.getState())).toBe(true); // pending

    await p;

    const st = store.getState();
    expect(selectUserLoading(st)).toBe(false);
    expect(selectUser(st)).toEqual(user);
    expect(selectIsAuthChecked(st)).toBe(true);

    expect(window.localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'REFRESH_TOKEN');
    expect(setCookie).toHaveBeenCalledWith('accessToken', 'ACCESS.TOKEN');
    expect(registerUserApi).toHaveBeenCalledTimes(1);
  });

  it('loginUser: успех — кладёт пользователя, токены и cookie', async () => {
    loginUserApi.mockResolvedValueOnce(apiAuthResp(user));
    const store = makeStore();

    await store.dispatch(loginUser({ email: 'a@a.a', password: '123' }));

    const st = store.getState();
    expect(selectUser(st)).toEqual(user);
    expect(selectIsAuthChecked(st)).toBe(true);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'REFRESH_TOKEN');
    expect(setCookie).toHaveBeenCalledWith('accessToken', 'ACCESS.TOKEN');
  });

  it('fetchUser: успех — кладёт user и отмечает authChecked', async () => {
    getUserApi.mockResolvedValueOnce({ user });
    const store = makeStore();

    await store.dispatch(fetchUser());
    const st = store.getState();
    expect(selectUser(st)).toEqual(user);
    expect(selectIsAuthChecked(st)).toBe(true);
    expect(getUserApi).toHaveBeenCalledTimes(1);
  });

  it('updateUser: успех — обновляет user (authChecked не меняется)', async () => {
    updateUserApi.mockResolvedValueOnce({ user: { ...user, name: 'Bob' } });
    const store = makeStore({ user: { ...getInitial(), data: user, isAuthChecked: true } });

    await store.dispatch(updateUser({ name: 'Bob' }));
    const st = store.getState();
    expect(selectUser(st)).toEqual({ ...user, name: 'Bob' });
    expect(selectIsAuthChecked(st)).toBe(true);
    expect(updateUserApi).toHaveBeenCalledWith({ name: 'Bob' });
  });

  it('logout: успех — чистит user и токены/куки, ставит authChecked=true', async () => {
    const store = makeStore({ user: { ...getInitial(), data: user, isAuthChecked: false } });

    await store.dispatch(logout());
    const st = store.getState();
    expect(selectUser(st)).toBeNull();
    expect(selectIsAuthChecked(st)).toBe(true);

    expect(logoutApi).toHaveBeenCalledTimes(1);
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(setCookie).toHaveBeenCalledWith('accessToken', '', { expires: -1 });
  });
});