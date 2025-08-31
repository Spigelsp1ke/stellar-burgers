import { Preloader } from '@ui';
import { FeedUI } from '@ui-pages';
import { TOrder } from '@utils-types';
import { FC, useEffect } from 'react';
import {
  fetchFeed,
  selectFeed,
  selectFeedLoading,
  selectFeedError
} from '../../services/feed/slice';
import { useDispatch, useSelector } from '../../services/store';

export const Feed: FC = () => {
  const dispatch = useDispatch();
  const feed = useSelector(selectFeed);
  const loading = useSelector(selectFeedLoading);
  const error = useSelector(selectFeedError);

  useEffect(() => {
    if (!feed) dispatch(fetchFeed());
  }, [dispatch, feed]);

  if (loading && !feed) {
    return <Preloader />;
  }

  if (error) {
    return <div style={{ padding: 16 }}>Ошибка: {error}</div>;
  }

  const orders = feed?.orders ?? [];

  return (
    <FeedUI orders={orders} handleGetFeeds={() => dispatch(fetchFeed())} />
  );
};
