export const formatDate = (dateInput: string | number | Date) => {
  if (!dateInput) {
    return new Date().toISOString();
  }

  if (
    typeof dateInput === 'number' ||
    (typeof dateInput === 'string' && !isNaN(Number(dateInput)))
  ) {
    const timestamp = Number(dateInput);
    const date =
      timestamp.toString().length > 10
        ? new Date(timestamp)
        : new Date(timestamp * 1000);

    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }

    return date.toISOString();
  }

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
};
