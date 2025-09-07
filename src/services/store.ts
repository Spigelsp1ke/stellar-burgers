import { combineReducers, configureStore } from '@reduxjs/toolkit';

import {
  TypedUseSelectorHook,
  useDispatch as dispatchHook,
  useSelector as selectorHook
} from 'react-redux';

import { ingredientsReducer } from './ingredients/slice';
import { burgerConstructorReducer } from './burger-constructor/slice';
import { feedReducer } from './feed/slice';
import { ordersReducer } from './orders/slice';
import { orderDetailsReducer } from './order-details/slice';
import { userReducer } from './user/slice';

export const rootReducer = combineReducers({
  ingredients: ingredientsReducer,
  burgerConstructor: burgerConstructorReducer,
  feed: feedReducer,
  orders: ordersReducer,
  orderDetails: orderDetailsReducer,
  user: userReducer
});

const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production'
});

export type RootState = ReturnType<typeof rootReducer>;

export type AppDispatch = typeof store.dispatch;

export const useDispatch: () => AppDispatch = () => dispatchHook();
export const useSelector: TypedUseSelectorHook<RootState> = selectorHook;

export default store;
