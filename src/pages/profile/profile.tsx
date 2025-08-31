import { ProfileUI } from '@ui-pages';
import { FC, SyntheticEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from '../../services/store';
import {
  fetchUser,
  updateUser,
  selectUser,
  selectIsAuthChecked
} from '../../services/user/slice';

import { useNavigate } from 'react-router-dom';
import { useForm } from '../../hooks/use-form';

type TProfileForm = {
  name: string;
  email: string;
  password: string;
};

export const Profile: FC = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const isAuthChecked = useSelector(selectIsAuthChecked);

  useEffect(() => {
    if (!isAuthChecked || !user) {
      dispatch(fetchUser());
    }
  }, [dispatch, isAuthChecked, user]);

  const {
    values: formValue,
    onChange,
    setValues,
    reset
  } = useForm<TProfileForm>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: ''
  });

  useEffect(() => {
    setValues((prevState) => ({
      ...prevState,
      name: user?.name || '',
      email: user?.email || ''
    }));
  }, [user, setValues]);

  const isFormChanged =
    formValue.name !== (user?.name ?? '') ||
    formValue.email !== (user?.email ?? '') ||
    !!formValue.password;

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!isFormChanged) return;

    const payload: Partial<typeof formValue> = {};
    if (formValue.name.trim() !== (user?.name ?? ''))
      payload.name = formValue.name.trim();
    if (formValue.email.trim() !== (user?.email ?? ''))
      payload.email = formValue.email.trim();
    if (formValue.password.trim()) payload.password = formValue.password.trim();

    try {
      const result = await dispatch(updateUser(payload)).unwrap();
      const updatedUser = result;

      setValues((prev) => ({
        ...prev,
        name: updatedUser.name,
        email: updatedUser.email,
        password: ''
      }));
    } catch (err) {
      console.error('Не удалось обновить профиль', err);
    }
  };

  const handleCancel = (e: SyntheticEvent) => {
    e.preventDefault();
    reset({ name: user?.name ?? '', email: user?.email ?? '', password: '' });
  };

  const handleInputChange = onChange;

  return (
    <ProfileUI
      formValue={formValue}
      isFormChanged={isFormChanged}
      handleCancel={handleCancel}
      handleSubmit={handleSubmit}
      handleInputChange={handleInputChange}
    />
  );
};
