/* eslint-disable no-param-reassign */
import i18next from 'i18next';
import onChange from 'on-change';
import * as yup from 'yup';

import resources from './locales';

const DEFAULT_LANGUAGE = 'ru';

const validateURL = (url, downloadedURLS) => {
  const schema = yup.string().required().url().notOneOf(downloadedURLS);
  return schema
    .validate(url, { abortEarly: false })
    .then(() => [])
    .catch((e) => e.inner);
};

const handleSubmit = (state) => (e) => {
  e.preventDefault();

  const { value } = e.target.elements.addressInput;
  state.requestForm.inputValue = value;

  const downloadedURLS = Object.keys(state.feeds);
  validateURL(value, downloadedURLS).then((errors) => {
    state.requestForm.errors = errors;
  });
};

const buildRequestFormElement = (state, i18n) => {
  const form = document.createElement('form');

  const div = document.createElement('div');
  div.classList.add('mb-3', 'pt-3');

  const input = document.createElement('input');
  input.value = state.requestForm.inputValue || '';
  input.classList.add('form-control');
  input.setAttribute('type', 'text');
  input.setAttribute('id', 'addressInput');
  input.setAttribute('aria-describedby', 'addressHelp');
  input.setAttribute('placeholder', i18n.t('requestForm.placeholder'));

  const addressHelp = document.createElement('div');
  addressHelp.textContent = i18n.t('requestForm.example');
  addressHelp.classList.add('form-text');
  addressHelp.setAttribute('id', 'addressHelp');

  const feedback = document.createElement('div');
  feedback.classList.add('feedback');
  feedback.setAttribute('id', 'validationAddressInput');

  div.append(input, addressHelp, feedback);

  const submit = document.createElement('button');
  submit.textContent = i18n.t('requestForm.buttonAdd');
  submit.classList.add('btn', 'btn-primary');
  submit.setAttribute('type', 'submit');

  form.addEventListener('submit', handleSubmit(state));

  form.append(div, submit);
  return form;
};

const renderForm = (container, state, i18n) => {
  const form = buildRequestFormElement(state, i18n);
  container.innerHTML = '';
  container.append(form);
  form.elements.addressInput.focus();
};

const renderErrors = (errors) => {
  const input = document.getElementById('addressInput');
  const feedback = document.getElementById('validationAddressInput');

  if (errors.length > 0) {
    const messages = errors.map(({ message }) => message);

    feedback.classList.add('invalid-feedback');
    feedback.textContent = messages.join(', ');

    input.setAttribute('aria-describedby', feedback.id);
    input.classList.add('is-invalid');
  } else {
    feedback.classList.remove('invalid-feedback');
    feedback.textContent = ' ';

    input.classList.remove('is-invalid');
    input.setAttribute('aria-describedby', 'addressHelp');
  }
};

const setSubmitAvailability = (value) => {
  const submitButton = document.querySelector('[type="submit"]');
  if (value === 'filling') {
    submitButton.disabled = false;
  }
  if (value === 'sending') {
    submitButton.disabled = true;
  }
  if (value === 'failed') {
    submitButton.disabled = false;
  }
  if (value === 'finished') {
    submitButton.disabled = false;
  }
};

export default () => {
  const state = {
    language: DEFAULT_LANGUAGE,
    requestForm: {
      state: 'filling',
      inputValue: null,
      errors: [],
    },
    feeds: {},
  };

  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({ lng: DEFAULT_LANGUAGE, resources })
    .then(() => {
      const root = document.getElementById('root');
      const watchedState = onChange(state, (path, value) => {
        if (path === 'requestForm.errors') {
          renderErrors(value);
        }

        if (path === 'requestForm.state') {
          setSubmitAvailability(value);
        }
      });

      renderForm(root, watchedState, i18nextInstance);
    });
};
