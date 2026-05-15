type QueryParams = Record<string, string | undefined>;

export const getPagination = (query: QueryParams) => {
  const rawPage = query.page;
  const rawLimit = query.limit;

  const page = Math.max(
    1,
    Number.isFinite(Number(rawPage)) ? Number(rawPage) : 1,
  );

  const limit = Math.min(
    50,
    Math.max(1, Number.isFinite(Number(rawLimit)) ? Number(rawLimit) : 10),
  );

  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
};
