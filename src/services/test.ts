import store from './store';
import type { RootState } from './store';

describe('rootReducer / store init', () => {
  it('инициализируется с нужными ключами и корректным initial state', () => {
    const state: RootState = store.getState();

    expect(state).toHaveProperty('ingredients');
    expect(state).toHaveProperty('burgerConstructor');
    expect(state).toHaveProperty('feed');
    expect(state).toHaveProperty('orders');
    expect(state).toHaveProperty('orderDetails');
    expect(state).toHaveProperty('user');

    expect(state.burgerConstructor).toEqual({
      bun: null,
      ingredients: [],
    });

    expect(state.ingredients).toBeDefined();
    expect(state.feed).toBeDefined();
    expect(state.orders).toBeDefined();
    expect(state.orderDetails).toBeDefined();
    expect(state.user).toBeDefined();
  });
});
