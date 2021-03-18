import * as yup from 'yup';
import i18n from 'i18next';

// to do: fix error translation
export default (url, downloadedURLS) => {
  const schema = yup
    .string()
    .required(i18n.t('validation.required'))
    .url(i18n.t('validation.url'))
    .notOneOf(downloadedURLS, i18n.t('validation.notOneOf'));
  return schema
    .validate(url, { abortEarly: false })
    .then(() => [])
    .catch((e) => e.inner);
};
