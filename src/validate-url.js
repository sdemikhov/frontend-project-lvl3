import * as yup from 'yup';

export default (url, downloadedURLS) => {
  const schema = yup.string().required().url().notOneOf(downloadedURLS);
  return schema
    .validate(url, { abortEarly: false })
    .then(() => [])
    .catch((e) => ...e.inner);
};
