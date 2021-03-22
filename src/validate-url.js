import * as yup from 'yup';

yup.setLocale({
  mixed: {
    notOneOf: () => ({ localization: { key: 'validation.notOneOf' } }),
  },
  string: {
    required: () => ({ localization: { key: 'validation.required' } }),
    url: () => ({ localization: { key: 'validation.url' } }),
  },
});

export default (url, downloadedURLS) => {
  const schema = yup
    .string()
    .required()
    .url()
    .notOneOf(downloadedURLS);
  return schema
    .validate(url, { abortEarly: false })
    .then(() => [])
    .catch((e) => e.inner);
};
