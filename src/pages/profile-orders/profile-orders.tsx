import { ProfileOrdersUI } from '@ui-pages';
import { TOrder } from '@utils-types';
import { FC, useEffect } from 'react';

import {
  fetchMyOrders,
  selectMyOrders,
  selectOrdersLoading
} from '../../services/orders/slice';

import {
  fetchIngredients,
  selectIngredientsItems
} from '../../services/ingredients/slice';
import { useDispatch, useSelector } from '../../services/store';

export const ProfileOrders: FC = () => {
  const dispatch = useDispatch();

  const orders = useSelector(selectMyOrders);
  const ingredients = useSelector(selectIngredientsItems);

  useEffect(() => {
    if (!orders.length) {
      dispatch(fetchMyOrders());
    }
  }, [dispatch, orders.length]);

  useEffect(() => {
    if (!ingredients.length) {
      dispatch(fetchIngredients());
    }
  }, [dispatch, ingredients.length]);

  return <ProfileOrdersUI orders={orders} />;
};
