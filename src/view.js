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

export default (path, value) => {
  if (path === 'requestForm.errors') {
    renderErrors(value);
  }

  if (path === 'requestForm.state') {
    setSubmitAvailability(value);
  }
};
