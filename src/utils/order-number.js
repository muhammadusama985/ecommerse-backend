const createOrderNumber = () => {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `NR-${Date.now()}-${randomPart}`;
};

export { createOrderNumber };
