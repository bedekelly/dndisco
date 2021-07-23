export const apiURL = (process.env.REACT_APP_API_URL as string).replaceAll(
  '"',
  ""
);
