import '@testing-library/cypress/add-commands'

declare global {
  namespace Cypress {
    interface Chainable {
      setAuthTokens(access?: string, refresh?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('setAuthTokens', (access = 'TEST_ACCESS', refresh = 'TEST_REFRESH') => {
  cy.setCookie('accessToken', access);
  cy.window().then((win) => {
    win.localStorage.setItem('refreshToken', refresh);
  });
});