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
import { selectUser } from '../../../services/user/slice';
import { useSelector } from '../../../services/store';

export const AppHeaderUI: FC<TAppHeaderUIProps> = () => {
  const user = useSelector(selectUser);

  const iconType = (active: boolean) => (active ? 'primary' : 'secondary');

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.link} ${isActive ? styles.link_active : 'text_color_inactive'}`;

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
          <NavLink to='/'>
            <Logo className='' />
          </NavLink>
        </div>
        <div className={styles.link_position_last}>
          <NavLink to='/profile' className={linkClass}>
            {({ isActive }) => (
              <>
                <ProfileIcon type={iconType(isActive)} />
                <p className='text text_type_main-default ml-2'>
                  {user?.name || 'Личный кабинет'}
                </p>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </header>
  );
};
