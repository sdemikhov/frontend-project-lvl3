import RequestForm from './request-form.js';

export default () => {
  const root = document.getElementById('root');

  const requestForm = new RequestForm(root);
  requestForm.render();
};
