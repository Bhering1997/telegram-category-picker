const app = window.Telegram?.WebApp;
const form = document.querySelector('#selection');
const status = document.querySelector('#message');
const search = document.querySelector('#search');
const choices = document.querySelector('#choices');
const selectedLabel = document.querySelector('#selected');
const matches = document.querySelector('#matches');
const confirm = document.querySelector('#confirm');
const error = document.querySelector('#error');

function readPicker() {
  const encoded = location.hash.match(/(?:^#|[&?])pick=([A-Za-z0-9_-]+)(?=$|[&?])/)?.[1];
  if (!encoded) return null;

  try {
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (/^[a-f0-9]{32}$/.test(data.draft) && Array.isArray(data.choices)
        && data.choices.length > 0 && data.choices.every(label => typeof label === 'string')) {
      return data;
    }
  } catch {
    return null;
  }
  return null;
}

function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function showPicker(data) {
  let selectedIndex = null;
  const options = data.choices.map((name, index) => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    const text = document.createElement('span');
    label.className = 'choice';
    radio.type = 'radio';
    radio.name = 'category';
    radio.value = index;
    text.textContent = name;
    label.append(radio, text);
    choices.append(label);
    radio.addEventListener('change', () => {
      selectedIndex = index;
      selectedLabel.textContent = name;
      confirm.disabled = false;
    });
    return { label, name: normalize(name) };
  });

  function filter() {
    const terms = normalize(search.value).split(/\s+/);
    let count = 0;
    for (const option of options) {
      const visible = terms.every(term => option.name.includes(term));
      option.label.hidden = !visible;
      if (visible) count += 1;
    }
    choices.scrollTop = 0;
    matches.textContent = count === 0 ? 'Nenhuma categoria encontrada.'
      : count === 1 ? '1 categoria' : count + ' categorias';
  }

  search.addEventListener('input', filter);
  search.addEventListener('keydown', event => {
    if (event.key === 'Enter') event.preventDefault();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (selectedIndex === null || confirm.disabled) return;
    confirm.disabled = true;
    error.hidden = true;
    try {
      app.sendData(JSON.stringify({ draft: data.draft, index: selectedIndex }));
    } catch {
      error.textContent = 'Não foi possível confirmar. Tente novamente.';
      error.hidden = false;
      confirm.disabled = false;
    }
  });

  filter();
  status.hidden = true;
  form.hidden = false;
  app.expand();
}

app?.ready();
const picker = readPicker();
if (picker && typeof app?.sendData === 'function') showPicker(picker);
