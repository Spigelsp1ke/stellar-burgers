import { FC, useMemo } from 'react';
import { useSelector } from '../../services/store';
import { TOrder, TOrdersData } from '@utils-types';
import { FeedInfoUI } from '../ui/feed-info';
import { selectFeed } from '../../services/feed/slice';

const getOrders = (orders: TOrder[], status: string): number[] =>
  orders
    .filter((item) => item.status === status)
    .map((item) => item.number)
    .slice(0, 20);

export const FeedInfo: FC = () => {
  const feed = useSelector(selectFeed);
  const orders = feed?.orders ?? [];

  const readyOrders = useMemo(() => getOrders(orders, 'done'), [orders]);

  const pendingOrders = useMemo(() => getOrders(orders, 'pending'), [orders]);

  const feedTotals: Pick<TOrdersData, 'total' | 'totalToday'> = {
    total: feed?.total ?? 0,
    totalToday: feed?.totalToday ?? 0
  };

  return (
    <FeedInfoUI
      readyOrders={readyOrders}
      pendingOrders={pendingOrders}
      feed={feedTotals}
    />
  );
};
