import { FC, useEffect, useMemo } from 'react';
import { Preloader } from '../ui/preloader';
import { IngredientDetailsUI } from '../ui/ingredient-details';
import { useDispatch, useSelector } from '../../services/store';
import { useParams } from 'react-router-dom';
import { NotFound404 } from '@pages';
import {
  fetchIngredients,
  selectIngredientsItems,
  selectIngredientsLoading
} from '../../services/ingredients/slice';

export const IngredientDetails: FC = () => {
  const { id } = useParams<{ id: string }>();

  const dispatch = useDispatch();

  const loading = useSelector(selectIngredientsLoading);
  const items = useSelector(selectIngredientsItems);

  useEffect(() => {
    if (!items.length) {
      dispatch(fetchIngredients());
    }
  }, [dispatch, items.length]);

  const ingredientData = useMemo(
    () => items.find((item) => item._id === id),
    [items, id]
  );

  if (loading || !items.length) {
    return <Preloader />;
  }

  if (!ingredientData) {
    return <NotFound404 />;
  }

  return <IngredientDetailsUI ingredientData={ingredientData} />;
};
