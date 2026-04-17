const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

const parsePagination = (query = {}) => {
  const page = Math.max(Number(query.page || DEFAULT_PAGE), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || DEFAULT_PAGE_SIZE), 1), MAX_PAGE_SIZE);
  return { page, pageSize };
};

const paginateItems = (items, query = {}) => {
  const { page, pageSize } = parsePagination(query);
  const start = (page - 1) * pageSize;
  const paginatedItems = items.slice(start, start + pageSize);
  return {
    items: paginatedItems,
    total: items.length,
    page,
    pageSize,
  };
};

module.exports = { parsePagination, paginateItems, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE };
