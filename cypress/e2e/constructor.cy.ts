import type {} from "cypress";

const API = "https://norma.nomoreparties.space/api";

const visitClean = (path = "/") =>
  cy.visit(path, {
    onBeforeLoad(win) {
      if ("serviceWorker" in win.navigator) {
        win.navigator.serviceWorker
          .getRegistrations()
          .then((rs) => rs.forEach((r) => r.unregister()));
      }
      if ("caches" in win) {
        win.caches.keys().then((keys) => keys.forEach((k) => win.caches.delete(k)));
      }
      win.localStorage.clear();
      win.sessionStorage.clear();
    },
  });

const interceptIngredients = () => {
  cy.fixture('ingredients.json').then((ingredients) => {
    const body = { success: true, data: ingredients };
    cy.intercept(
      { method: 'GET', url: '**/ingredients*', middleware: true },
      (req) => req.reply({ statusCode: 200, body })
    ).as('ingredients');
  });
};

const interceptUserOK = () => {
  cy.fixture('user.json').then((user) => {
    const body = { success: true, user: (user as any).user ?? user };
    cy.intercept(
      { method: 'GET', url: '**/auth/user*', middleware: true },
      (req) => req.reply({ statusCode: 200, body })
    ).as('user');
  });
};

const interceptUser401 = () => {
  const body = { success: false, message: "Unauthorized" };
  cy.intercept(
    { method: 'GET', url: '**/auth/user*', middleware: true },
    (req) => req.reply({ statusCode: 401, body: { success: false, message: 'Unauthorized' } })
  ).as('user401');
};

const interceptCreateOrder = () => {
  cy.fixture('order.json').then((orderResp) => {
    const body = { success: true, ...(orderResp as any) };
    cy.intercept(
      { method: 'POST', url: '**/orders*', middleware: true },
      (req) => req.reply({ statusCode: 200, body })
    ).as('createOrder');
  });
};

describe("Burger Constructor — проверка intercept-only", () => {
  it("Открывает модалку ингредиента и закрывает крестиком/оверлеем", () => {
    interceptIngredients();
    visitClean("/");

    cy.wait("@ingredients", { timeout: 15000 });

    cy.contains(/кратор.*булка/i).should("be.visible").click();
    cy.contains(/детали ингредиента/i).should("be.visible");

    cy.get("body").then(($body) => {
      const closeBtn = $body.find(
        'button[aria-label*="закры"], button[aria-label*="Закры"], button[class*="close"]'
      );
      if (closeBtn.length) {
        cy.wrap(closeBtn.first()).click({ force: true });

        cy.contains(/кратор.*булка/i).click();
        cy.contains(/детали ингредиента/i).should("be.visible");
        cy.get('div[class*="overlay"], div[class*="modal__overlay"], [role="dialog"]')
          .first()
          .click("topLeft");
        cy.contains(/детали ингредиента/i).should("not.exist");
      } else {
        cy.go("back");
        cy.contains(/детали ингредиента/i).should("not.exist");

        cy.contains(/кратор.*булка/i).click();
        cy.contains(/детали ингредиента/i).should("be.visible");
        cy.get("body").type("{esc}");
        cy.contains(/детали ингредиента/i).should("not.exist");
      }
    });
  });

  it("Создаёт заказ (с токенами), показывает номер и очищает конструктор", () => {
    cy.setCookie("accessToken", "TEST_ACCESS");
    cy.window().then((win) => win.localStorage.setItem("refreshToken", "TEST_REFRESH"));

    interceptIngredients();
    interceptUserOK();
    interceptCreateOrder();

    visitClean("/");
    cy.wait("@ingredients", { timeout: 15000 });
    cy.wait("@user", { timeout: 15000 });

    cy.contains(/кратор.*булка/i)
      .parentsUntil("body")
      .parent()
      .find("button")
      .contains(/добавить/i)
      .first()
      .click();

    cy.contains(/метеорит/i)
      .parentsUntil("body")
      .parent()
      .find("button")
      .contains(/добавить/i)
      .first()
      .click();

    cy.contains(/\d+/).should("exist");

    cy.contains("button", /оформить заказ/i).click();

    cy.wait("@createOrder", { timeout: 20000 });

    cy.contains("777").should("be.visible");

    cy.get("body").then(($body) => {
      const closeBtn = $body.find(
        'button[aria-label*="закры"], button[aria-label*="Закры"], button[class*="close"]'
      );
      if (closeBtn.length) cy.wrap(closeBtn.first()).click({ force: true });
      else cy.get("body").type("{esc}");
    });

    cy.contains(/\b0\b/).should("exist");
  });

  it("Редиректит на /login без авторизации", () => {
    interceptIngredients();
    interceptUser401();

    visitClean("/");
    cy.wait("@ingredients", { timeout: 15000 });

    cy.contains(/кратор.*булка/i)
      .parentsUntil("body")
      .parent()
      .find("button")
      .contains(/добавить/i)
      .first()
      .click();

    cy.contains("button", /оформить заказ/i).click();

    cy.location("pathname").should("include", "/login");
  });
});
