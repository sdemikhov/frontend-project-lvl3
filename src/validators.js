import * as yup from 'yup';

const validateURL = (url, addedURLS) => {
  const schema = yup.string().required().url().notOneOf(addedURLS);

  try {
    schema.validateSync(url, { abortEarly: false });
    return null;
  } catch (err) {
    return err.message;
  }
};

const buildValidators = () => {
  yup.setLocale({
    mixed: {
      notOneOf: () => 'validation.notOneOf',
      required: () => 'validation.required',
    },
    string: { url: () => 'validation.url' },
  });

  return { validateURL };
};

export default buildValidators();
