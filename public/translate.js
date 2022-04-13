const defaultLanguage = 'en'

let language
let translations = {}

document.addEventListener('DOMContentLoaded', () => {
    setLanguage(defaultLanguage)
    bindLanguageSwitcher(defaultLanguage)
})

async function setLanguage(newLanguge) {
    if(newLanguge === language) return

    const newTranslations = await fetchTranslations(newLanguge)

    language = newLanguge
    translations = newTranslations

    translatePage()
}

async function fetchTranslations(newLanguge) {
    const response = await fetch(`./language/${newLanguge}.json`);
    return await response.json();
  }

  function translatePage() {
      document.querySelectorAll('[data-key]').forEach(translateElement)
  }

  function translateElement(element) {
      const key = element.getAttribute('data-key')
      const translation = translations[key]
      if(key === 'add-vertex' || key === 'clear-all' || key === 'connect' || key === 'export') changeBtns(key,translation, element)
      else element.innerText = translation
  }

  function changeBtns(key,translation,el) {
      if(key === 'add-vertex') el.innerHTML = `<i class="fas fa-plus"></i> ${translation}`
      if(key === 'clear-all') el.innerHTML = `<i class="far fa-trash-alt"></i> ${translation}`
      if(key === 'connect') el.innerHTML = `<i class="fas fa-vector-square"></i> ${translation}`
      if(key === 'export') el.innerHTML = `<i class="fas fa-download"></i> ${translation}`
  }

  function bindLanguageSwitcher(initialValue) {
    const switcher = 
      document.querySelector("[data-switcher]");
    switcher.value = initialValue;
    switcher.onchange = (e) => {
      setLanguage(e.target.value);
    };
  }