import { PropsWithChildren, FC } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from '../services/store';
import { selectUser, selectIsAuthChecked } from '../services/user/slice';
import { Preloader } from '@ui';

const ProtectedRoute: FC<PropsWithChildren<{ onlyUnAuth?: boolean }>> = ({
  onlyUnAuth = false,
  children
}) => {
  const user = useSelector(selectUser);
  const isAuthChecked = useSelector(selectIsAuthChecked);
  const location = useLocation();

  if (!isAuthChecked) {
    return <Preloader />;
  }

  if (onlyUnAuth) {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      return <Navigate to={from} replace />;
    }
    return children;
  }

  if (!user) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
