import type {} from "cypress";

type Ingredient = {
  _id: string;
  name: string;
  type?: string;
  proteins?: number;
  fat?: number;
  carbohydrates?: number;
  calories?: number;
  price?: number;
  image?: string;
  image_large?: string;
  image_mobile?: string;
};

type IngredientsFixture = Ingredient[];

interface User {
  name: string;
  email: string;
}

type UserFixture = { user: User };

type OrderPayload = { order: { number: number } };
type OrderResponse = { success: true } & OrderPayload & Record<string, unknown>;

const SEL = {
  ingredientCard: (id: string) => `[data-cy="ingredient-card"][data-id="${id}"]`,
  ingredientCardAdd: (id: string) =>
    `[data-cy="ingredient-card"][data-id="${id}"] [data-cy="add-button"]`,
  ingredientCardCounter: (id: string) =>
    `[data-cy="ingredient-card"][data-id="${id}"] [data-cy="counter"]`,
  constructorItem: (id: string) => `[data-cy="constructor-item"][data-id="${id}"]`,
  constructorItemsAny: `[data-cy="constructor-item"]`,
  ingredientModal: `[data-cy="ingredient-modal"]`,
  ingredientTitle: `[data-cy="ingredient-title"]`,
  modalClose: `[data-cy="modal-close"]`,
} as const;

const resolveIngredients = (f: IngredientsFixture): Ingredient[] => f;
const toUserBody = (u: UserFixture): { user: User } => u;
const getOrderNumber = (o: OrderPayload): number => o.order.number;

const visitClean = (path = "/") => {
  cy.clearCookies();
  cy.clearLocalStorage();
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
      win.sessionStorage.clear();
    },
  });
};

const interceptIngredients = () => {
  cy.fixture<IngredientsFixture>("ingredients.json").then((ingredients) => {
    const body = { success: true, data: ingredients } as const;
    cy.intercept("GET", "**/ingredients*", body).as("ingredients");
  });
};

const interceptUserOK = () => {
  cy.fixture<UserFixture>("user.json").then((user) => {
    const body = { success: true, user: user.user } as const;
    cy.intercept("GET", "**/auth/user*", body).as("user");
  });
};

const interceptUser401 = () => {
  cy.intercept("GET", "**/auth/user*", { success: false, message: "Unauthorized" }).as("user401");
};

const interceptCreateOrder = () => {
  cy.fixture<OrderPayload>("order.json").then((orderResp) => {
    const body: OrderResponse = { success: true, ...orderResp };
    cy.intercept("POST", "**/orders*", body).as("createOrder");
  });
};

const expectCardCounter = (id: string, n: number) =>
  cy.get(SEL.ingredientCardCounter(id)).should("have.text", String(n));

describe("Burger Constructor", () => {
  afterEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
      if ("caches" in win) {
        win.caches.keys().then((keys) => keys.forEach((k) => win.caches.delete(k)));
      }
    });
  });

  it("Открывает модалку ингредиента и проверяет название", () => {
    interceptIngredients();
    interceptUserOK();

    visitClean("/");
    cy.wait(["@ingredients", "@user"]);

    cy.fixture<IngredientsFixture>("ingredients.json").then((ingredients) => {
      const krator = ingredients.find((i) => /Краторная булка/i.test(i.name));
      expect(krator, 'Ингредиент "Краторная булка" должен быть в фикстуре').to.exist;

      cy.get(SEL.ingredientCard(krator!._id)).click();
      cy.get(`${SEL.ingredientModal} ${SEL.ingredientTitle}`).should("have.text", krator!.name);
      cy.get(SEL.modalClose).click();
      cy.get(SEL.ingredientModal).should("not.exist");
    });
  });

  it("Создаёт заказ и проверяет ингредиенты и счётчики", () => {
    cy.setCookie("accessToken", "TEST_ACCESS");
    cy.window().then((win) => win.localStorage.setItem("refreshToken", "TEST_REFRESH"));

    interceptIngredients();
    interceptUserOK();
    interceptCreateOrder();

    visitClean("/");
    cy.wait(["@ingredients", "@user"]);

    cy.fixture<IngredientsFixture>("ingredients.json").then((ingredients) => {
      const bun = ingredients.find((i) => /Краторная булка/i.test(i.name));
      const main = ingredients.find((i) => /Метеорит/i.test(i.name));
      expect(bun, "Булка не найдена в фикстуре").to.exist;
      expect(main, "Начинка не найдена в фикстуре").to.exist;

      cy.get(SEL.ingredientCardAdd(bun!._id)).click();
      cy.get(SEL.ingredientCardAdd(main!._id)).click();

      cy.get(SEL.constructorItem(bun!._id)).should("exist");
      cy.get(SEL.constructorItem(main!._id)).should("exist");

      expectCardCounter(bun!._id, 2);
      expectCardCounter(main!._id, 1);

      cy.contains("button", /оформить заказ/i).click();
      cy.wait("@createOrder");

      cy.fixture<OrderPayload>("order.json").then((o) => {
        const n = getOrderNumber(o);
        cy.contains(new RegExp(`^${n}$`)).should("be.visible");
      });

      cy.get(SEL.modalClose).click();
      cy.get(SEL.constructorItemsAny).should("not.exist");
    });
  });

  it("Редиректит на /login без авторизации", () => {
    interceptIngredients();
    interceptUser401();

    visitClean("/");
    cy.wait("@ingredients");

    cy.fixture<IngredientsFixture>("ingredients.json").then((ingredients) => {
      const bun = ingredients.find((i) => /Краторная булка/i.test(i.name));
      expect(bun, "Булка не найдена в фикстуре").to.exist;
      cy.get(SEL.ingredientCardAdd(bun!._id)).click();
    });

    cy.contains("button", /оформить заказ/i).click();
    cy.location("pathname").should("include", "/login");
  });
});
