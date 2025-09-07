import store from './store';
import { rootReducer, type RootState } from './store';

describe('rootReducer / store init', () => {
  it('имеет нужные ключи редьюсеров', () => {
    const state: RootState = store.getState();
    expect(Object.keys(state).sort()).toEqual(
      ['ingredients', 'burgerConstructor', 'feed', 'orders', 'orderDetails', 'user'].sort()
    );
  });

  it('UNKNOWN_ACTION + undefined state -> корректный initial state', () => {
    const byRoot = rootReducer(undefined, { type: 'UNKNOWN_ACTION' });
    const byStore = store.getState();
    expect(byRoot).toEqual(byStore);
  });
});
