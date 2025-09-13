export const paginate = (items, currentPage, pageSize) => {
  const start = (currentPage - 1) * pageSize;
  return items.slice(start, start + pageSize);
};
