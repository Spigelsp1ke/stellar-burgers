import { FC, SyntheticEvent, useState } from 'react';
import { useDispatch } from '../../services/store';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginUI } from '@ui-pages';
import { loginUser } from '../../services/user/slice';

type LocationState = {
  from?: { pathname?: string };
};

export const Login: FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: LocationState;
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorText, setErrorText] = useState('');

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();

    setErrorText('');

    try {
      await dispatch(loginUser({ email, password })).unwrap();
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' &&
              err !== null &&
              'message' in err &&
              typeof (err as { message?: unknown }).message === 'string'
            ? (err as { message: string }).message
            : 'Не удалось войти';

      setErrorText(message);
    }
  };

  return (
    <LoginUI
      errorText={errorText}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      handleSubmit={handleSubmit}
    />
  );
};
