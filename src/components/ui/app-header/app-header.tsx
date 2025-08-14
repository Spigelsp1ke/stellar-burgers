import React, { FC } from 'react';
import styles from './app-header.module.css';
import { TAppHeaderUIProps } from './type';
import {
  BurgerIcon,
  ListIcon,
  Logo,
  ProfileIcon
} from '@zlden/react-developer-burger-ui-components';
import { NavLink } from 'react-router-dom';

export const AppHeaderUI: FC<TAppHeaderUIProps> = () => {
  const iconType = (active: boolean) => (active ? 'primary' : 'secondary');

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.link} ${isActive ? '' : 'text_color_inactive'}`;

  return (
    <header className={styles.header}>
      <nav className={`${styles.menu} p-4`}>
        <div className={styles.menu_part_left}>
          <NavLink to='/' className={linkClass}>
            {({ isActive }) => (
              <>
                <BurgerIcon type={iconType(isActive)} />
                <p className='text text_type_main-default ml-2 mr-10'>
                  Конструктор
                </p>
              </>
            )}
          </NavLink>
          <NavLink to='/feed' className={linkClass}>
            {({ isActive }) => (
              <>
                <ListIcon type={iconType(isActive)} />
                <p className='text text_type_main-default ml-2'>
                  Лента заказов
                </p>
              </>
            )}
          </NavLink>
        </div>
        <div className={styles.logo}>
          <Logo className='' />
        </div>
        <div className={styles.link_position_last}>
          <NavLink to='/profile' className={linkClass}>
            {({ isActive }) => (
              <>
                <ProfileIcon type={iconType(isActive)} />
                <p className='text text_type_main-default ml-2'>
                  Личный кабинет
                </p>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </header>
  );
};
