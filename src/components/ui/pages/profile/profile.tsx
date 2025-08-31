import { FC, useEffect, useRef, useState } from 'react';

import { Button, Input } from '@zlden/react-developer-burger-ui-components';
import styles from './profile.module.css';
import commonStyles from '../common.module.css';

import { ProfileUIProps } from './type';
import { ProfileMenu } from '@components';

export const ProfileUI: FC<ProfileUIProps> = ({
  formValue,
  isFormChanged,
  updateUserError,
  handleSubmit,
  handleCancel,
  handleInputChange
}) => {
  const [disabled, setDisabled] = useState({
    name: true,
    email: true,
    password: true
  });

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFormChanged) {
      setDisabled({ name: true, email: true, password: true });
    }
  }, [isFormChanged]);

  const onCancelClick = (e: React.SyntheticEvent) => {
    handleCancel(e);
    setDisabled({ name: true, email: true, password: true });
  };

  return (
    <main className={`${commonStyles.container}`}>
      <div className={`mt-30 mr-15 ${styles.menu}`}>
        <ProfileMenu />
      </div>
      <form
        className={`mt-30 ${styles.form} ${commonStyles.form}`}
        onSubmit={handleSubmit}
      >
        <>
          <div className='pb-6'>
            <Input
              type={'text'}
              placeholder={'Имя'}
              onChange={handleInputChange}
              value={formValue.name}
              name={'name'}
              error={false}
              errorText={''}
              size={'default'}
              icon={'EditIcon'}
              ref={nameRef}
              onIconClick={() => {
                setDisabled((s) => ({ ...s, name: false }));
                setTimeout(() => nameRef.current?.focus(), 0);
              }}
            />
          </div>
          <div className='pb-6'>
            <Input
              type={'email'}
              placeholder={'E-mail'}
              onChange={handleInputChange}
              value={formValue.email}
              name={'email'}
              error={false}
              errorText={''}
              size={'default'}
              icon={'EditIcon'}
              ref={emailRef}
              onIconClick={() => {
                setDisabled((s) => ({ ...s, email: false }));
                setTimeout(() => emailRef.current?.focus(), 0);
              }}
            />
          </div>
          <div className='pb-6'>
            <Input
              type={'password'}
              placeholder={'Пароль'}
              onChange={handleInputChange}
              value={formValue.password}
              name={'password'}
              error={false}
              errorText={''}
              size={'default'}
              icon={'EditIcon'}
              disabled={disabled.password}
              ref={passRef}
              onIconClick={() => {
                setDisabled((s) => ({ ...s, password: false }));
                setTimeout(() => passRef.current?.focus(), 0);
              }}
            />
          </div>
          {isFormChanged && (
            <div className={styles.button}>
              <Button
                type='secondary'
                htmlType='button'
                size='medium'
                onClick={onCancelClick}
              >
                Отменить
              </Button>
              <Button type='primary' size='medium' htmlType='submit'>
                Сохранить
              </Button>
            </div>
          )}
          {updateUserError && (
            <p
              className={`${commonStyles.error} pt-5 text text_type_main-default`}
            >
              {updateUserError}
            </p>
          )}
        </>
      </form>
    </main>
  );
};
