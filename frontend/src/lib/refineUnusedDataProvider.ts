import type { DataProvider } from "@refinedev/core";

// Every admin page fetches data through its own feature service/hook (per
// CLAUDE.md's feature-based architecture), never through Refine's data
// hooks (useTable/useForm/useSelect). Refine still requires a dataProvider
// prop to render, so this stub satisfies the type and fails loudly if a
// future page accidentally relies on Refine's own data fetching instead of
// a feature service.
function notUsed(method: string): never {
  throw new Error(
    `refineUnusedDataProvider.${method}: este proyecto no usa los data hooks de Refine, usá el service de la feature correspondiente.`
  );
}

export const refineUnusedDataProvider: DataProvider = {
  getList: () => notUsed("getList"),
  getOne: () => notUsed("getOne"),
  create: () => notUsed("create"),
  update: () => notUsed("update"),
  deleteOne: () => notUsed("deleteOne"),
  getApiUrl: () => notUsed("getApiUrl"),
};
