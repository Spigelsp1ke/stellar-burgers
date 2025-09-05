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
import * as api from '../../utils/burger-api';
import { setCookie } from '../../utils/cookie';
import {
  userReducer,
  initialState as userInitialState,
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

const registerUserApi = api.registerUserApi as jest.MockedFunction<typeof api.registerUserApi>;
const loginUserApi    = api.loginUserApi    as jest.MockedFunction<typeof api.loginUserApi>;
const getUserApi      = api.getUserApi      as jest.MockedFunction<typeof api.getUserApi>;
const updateUserApi   = api.updateUserApi   as jest.MockedFunction<typeof api.updateUserApi>;
const logoutApi       = api.logoutApi       as jest.MockedFunction<typeof api.logoutApi>;

type Awaited<T> = T extends Promise<infer U> ? U : T;

type TAuthResponse   = Awaited<ReturnType<typeof api.registerUserApi>>;
type TUserResponse   = Awaited<ReturnType<typeof api.getUserApi>>;
type TUpdateResponse = Awaited<ReturnType<typeof api.updateUserApi>>;

const user: TUser = { name: 'Alice', email: 'alice@example.com' };
const apiAuthResp = (u: TUser) => ({
  user: u,
  accessToken: 'ACCESS.TOKEN',
  refreshToken: 'REFRESH_TOKEN',
});

type UserState = typeof userInitialState;
type RootLocal = { user: UserState };

const makeStore = (pre?: Partial<RootLocal>) =>
  configureStore({
    reducer: { user: userReducer },
    preloadedState: pre as RootLocal | undefined,
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
    const state = userReducer(
      userInitialState,
      registerUser.pending('req1', { email: '', name: '', password: '' })
    );
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('registerUser.fulfilled: сохраняет user и отмечает authChecked', () => {
    const afterPending  = userReducer(
      userInitialState,
      registerUser.pending('req1', { email: '', name: '', password: '' })
    );
    const next = userReducer(
      afterPending,
      registerUser.fulfilled(user, 'req1', { email: '', name: '', password: '' })
    );
    expect(next.isLoading).toBe(false);
    expect(next.data).toEqual(user);
    expect(next.isAuthChecked).toBe(true);
    expect(next.error).toBeNull();
  });

  it('registerUser.rejected: пишет message/дефолт, isAuthChecked=true', () => {
    const loading = { ...userInitialState, isLoading: true };
    const withMsg = userReducer(
      loading,
      registerUser.rejected(new Error('Reg failed'), 'req1', { email: '', name: '', password: '' })
    );
    expect(withMsg.isLoading).toBe(false);
    expect(withMsg.error).toBe('Reg failed');
    expect(withMsg.isAuthChecked).toBe(true);

    const base = registerUser.rejected(new Error('x'), 'req1', { email: '', name: '', password: '' });
    const noMsgAction: ReturnType<typeof registerUser.rejected> = {
      type: registerUser.rejected.type,
      meta: base.meta,
      payload: undefined,
      error: {},
    };
    const noMsg = userReducer(loading, noMsgAction)
    expect(noMsg.error).toBe('Ошибка регистрации');
    expect(noMsg.isAuthChecked).toBe(true);
  });
});

describe('user thunks — интеграция со стором', () => {
  it('registerUser: успех — кладёт пользователя, токены и cookie', async () => {
    const authOk: TAuthResponse = {
      success: true,
      user,
      accessToken: 'ACCESS.TOKEN',
      refreshToken: 'REFRESH_TOKEN'
    };
    registerUserApi.mockResolvedValueOnce(authOk);
    const store = makeStore();

    const p = store.dispatch(registerUser({ email: 'a@a.a', name: 'Alice', password: '123' }));
    expect(selectUserLoading(store.getState())).toBe(true);

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
    const authOk: TAuthResponse = {
      success: true,
      user,
      accessToken: 'ACCESS.TOKEN',
      refreshToken: 'REFRESH_TOKEN'
    };
    loginUserApi.mockResolvedValueOnce(authOk);
    const store = makeStore();

    await store.dispatch(loginUser({ email: 'a@a.a', password: '123' }));

    const st = store.getState();
    expect(selectUser(st)).toEqual(user);
    expect(selectIsAuthChecked(st)).toBe(true);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'REFRESH_TOKEN');
    expect(setCookie).toHaveBeenCalledWith('accessToken', 'ACCESS.TOKEN');
  });

  it('fetchUser: успех — кладёт user и отмечает authChecked', async () => {
    const getOk: TUserResponse = { success: true, user };
    getUserApi.mockResolvedValueOnce(getOk);
    const store = makeStore();

    await store.dispatch(fetchUser());
    const st = store.getState();
    expect(selectUser(st)).toEqual(user);
    expect(selectIsAuthChecked(st)).toBe(true);
    expect(getUserApi).toHaveBeenCalledTimes(1);
  });

  it('updateUser: успех — обновляет user (authChecked не меняется)', async () => {
    const updated: TUpdateResponse = {
      success: true,
      user: { ...user, name: 'Bob' }
    };
    updateUserApi.mockResolvedValueOnce(updated);
    const store = makeStore({ user: { ...userInitialState, data: user, isAuthChecked: true } });

    await store.dispatch(updateUser({ name: 'Bob' }));
    const st = store.getState();
    expect(selectUser(st)).toEqual({ ...user, name: 'Bob' });
    expect(selectIsAuthChecked(st)).toBe(true);
    expect(updateUserApi).toHaveBeenCalledWith({ name: 'Bob' });
  });

  it('logout: успех — чистит user и токены/куки, ставит authChecked=true', async () => {
    const store = makeStore({ user: { ...userInitialState, data: user, isAuthChecked: false } });

    await store.dispatch(logout());
    const st = store.getState();
    expect(selectUser(st)).toBeNull();
    expect(selectIsAuthChecked(st)).toBe(true);

    expect(logoutApi).toHaveBeenCalledTimes(1);
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(setCookie).toHaveBeenCalledWith('accessToken', '', { expires: -1 });
  });
});