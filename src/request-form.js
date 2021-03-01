export default class RequestForm {
  constructor(target) {
    this.target = target;
  }

  render() {
    const form = document.createElement('form');
    form.innerHTML = `
      <div class="mb-3 pt-3">
        <input type="text" class="form-control" id="addressInput" aria-describedby="addressHelp" placeholder="Ссылка RSS">
        <div id="addressHelp" class="form-text">Пример: https://ru.hexlet.io/lessons.rss</div>
      </div>
      <button type="submit" class="btn btn-primary">Add</button>
    `;
    this.target.append(form);
  }
}
