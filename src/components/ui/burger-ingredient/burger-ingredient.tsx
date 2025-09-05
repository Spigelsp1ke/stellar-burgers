import React, { FC, memo } from 'react';
import { Link } from 'react-router-dom';
import styles from './burger-ingredient.module.css';

import {
  Counter,
  CurrencyIcon,
  AddButton
} from '@zlden/react-developer-burger-ui-components';

import { TBurgerIngredientUIProps } from './type';

export const BurgerIngredientUI: FC<TBurgerIngredientUIProps> = memo(
  ({ ingredient, count, handleAdd, locationState }) => {
    const { image, price, name, _id } = ingredient;

    return (
      <li className={styles.container} data-cy='ingredient-card' data-id={_id}>
        <Link
          className={styles.article}
          to={`/ingredients/${_id}`}
          state={locationState}
        >
          {count && (
            <span data-cy='counter'>
              <Counter count={count} />
            </span>
          )}
          <img className={styles.img} src={image} alt='картинка ингредиента.' />
          <div className={`${styles.cost} mt-2 mb-2`}>
            <p className='text text_type_digits-default mr-2'>{price}</p>
            <CurrencyIcon type='primary' />
          </div>
          <p className={`text text_type_main-default ${styles.text}`}>{name}</p>
        </Link>
        <div
          data-cy='add-button'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAdd();
          }}
        >
          <AddButton
            text='Добавить'
            onClick={handleAdd}
            extraClass={`${styles.addButton} mt-8`}
          />
        </div>
      </li>
    );
  }
);
