import { FC, useMemo } from 'react';
import { TConstructorIngredient } from '@utils-types';
import { BurgerConstructorUI } from '@ui';
import { useDispatch, useSelector } from '../../services/store';
import { useLocation, useNavigate } from 'react-router-dom';
import { selectUser } from '../../services/user/slice';
import {
  createOrder,
  resetLastCreated,
  selectLastCreatedOrder,
  selectOrdersLoading
} from '../../services/orders/slice';
import { clearConstructor } from '../../services/burger-constructor/slice';

export const BurgerConstructor: FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { bun, ingredients } = useSelector((state) => state.burgerConstructor);
  const user = useSelector(selectUser);

  const orderRequest = useSelector(selectOrdersLoading);
  const orderModalData = useSelector(selectLastCreatedOrder);

  const price = useMemo(
    () =>
      (bun ? bun.price * 2 : 0) +
      (ingredients as TConstructorIngredient[]).reduce(
        (s, v) => s + v.price,
        0
      ),
    [bun, ingredients]
  );

  const onOrderClick = () => {
    if (!bun || orderRequest) return;

    if (!user) {
      navigate('/login', { replace: true, state: { from: location } });
      return;
    }

    const ingredientIds = [bun._id, ...ingredients.map((i) => i._id), bun._id];

    dispatch(createOrder(ingredientIds));
  };

  const closeOrderModal = () => {
    dispatch(resetLastCreated());
    dispatch(clearConstructor());
  };

  const constructorItems = { bun, ingredients };

  return (
    <BurgerConstructorUI
      price={price}
      orderRequest={orderRequest}
      constructorItems={constructorItems}
      orderModalData={orderModalData}
      onOrderClick={onOrderClick}
      closeOrderModal={closeOrderModal}
    />
  );
};
