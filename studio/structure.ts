import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.documentTypeListItem("claimReview").title("Claim reviews"),
      S.documentTypeListItem("source").title("Sources"),
      S.documentTypeListItem("dataset").title("Datasets"),
      S.divider(),
      S.documentTypeListItem("topic").title("Topics"),
      S.documentTypeListItem("page").title("Pages (About and method)"),
    ]);
