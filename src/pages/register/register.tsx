import { FC, SyntheticEvent, useState } from 'react';
import { useDispatch, useSelector } from '../../services/store';
import { useLocation, useNavigate } from 'react-router-dom';
import { RegisterUI } from '@ui-pages';
import { registerUser, selectUserLoading } from '../../services/user/slice';

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error) return err.message;
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
};

export const Register: FC = () => {
  const dispatch = useDispatch();

  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorText, setErrorText] = useState('');

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setErrorText('');

    try {
      await dispatch(
        registerUser({ name: userName, email, password })
      ).unwrap();
    } catch (err: unknown) {
      setErrorText(getErrorMessage(err, 'Не удалось зарегистрироваться'));
    }
  };

  return (
    <RegisterUI
      errorText={errorText}
      email={email}
      userName={userName}
      password={password}
      setEmail={setEmail}
      setPassword={setPassword}
      setUserName={setUserName}
      handleSubmit={handleSubmit}
    />
  );
};
