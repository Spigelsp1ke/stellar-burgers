import { FC, memo, useMemo } from 'react';
import { useDispatch, useSelector } from '../../services/store';
import { BurgerConstructorElementUI } from '@ui';
import { BurgerConstructorElementProps } from './type';
import {
  moveIngredient,
  removeIngredient
} from '../../services/burger-constructor/slice';

export const BurgerConstructorElement: FC<BurgerConstructorElementProps> = memo(
  ({ ingredient }) => {
    const dispatch = useDispatch();

    const items = useSelector((s) => s.burgerConstructor.ingredients);

    const index = useMemo(
      () => items.findIndex((i) => i.id === ingredient.id),
      [items, ingredient.id]
    );
    const totalItems = items.length;

    const move = (delta: number) => {
      const from = index;
      const to = index + delta;
      if (from < 0) return;
      if (to < 0 || to >= totalItems) return;
      dispatch(moveIngredient({ fromIndex: from, toIndex: to }));
    };

    const handleMoveDown = () => move(1);

    const handleMoveUp = () => move(-1);

    const handleClose = () => {
      dispatch(removeIngredient(ingredient.id));
    };

    return (
      <BurgerConstructorElementUI
        ingredient={ingredient}
        index={index}
        totalItems={totalItems}
        handleMoveUp={handleMoveUp}
        handleMoveDown={handleMoveDown}
        handleClose={handleClose}
      />
    );
  }
);
