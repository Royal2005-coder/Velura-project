/**
 * Searchable Dropdown — thay thế <select> để gõ tìm kiếm.
 *
 * Usage:
 *   const dd = createSearchDropdown({
 *     container: document.getElementById("province-wrapper"),
 *     placeholder: "Chọn Tỉnh/Thành phố",
 *     options: [{ value: "1", label: "Thành phố Hà Nội" }, ...],
 *     onSelect: (value, label) => { ... }
 *   });
 *
 *   dd.setOptions(newOptions);   // Thay danh sách
 *   dd.setValue("");              // Reset
 *   dd.getValue();               // Lấy giá trị hiện tại
 */

export function createSearchDropdown({ container, placeholder = "Chọn...", options = [], onSelect = null }) {
  if (!container) return null;

  let currentValue = "";
  let isOpen = false;
  let filteredOptions = [...options];

  container.innerHTML = "";
  container.classList.add("search-dropdown");

  // Input
  const input = document.createElement("input");
  input.type = "text";
  input.className = "search-dropdown__input";
  input.placeholder = placeholder;
  input.setAttribute("autocomplete", "off");
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-haspopup", "listbox");

  // Dropdown list
  const list = document.createElement("div");
  list.className = "search-dropdown__list";
  list.setAttribute("role", "listbox");
  list.hidden = true;

  container.appendChild(input);
  container.appendChild(list);

  function renderList() {
    list.innerHTML = "";
    if (filteredOptions.length === 0) {
      const empty = document.createElement("div");
      empty.className = "search-dropdown__empty";
      empty.textContent = "Không tìm thấy kết quả";
      list.appendChild(empty);
      return;
    }
    filteredOptions.forEach(opt => {
      const item = document.createElement("div");
      item.className = "search-dropdown__item";
      if (opt.value === currentValue) item.classList.add("is-selected");
      item.textContent = opt.label;
      item.setAttribute("role", "option");
      item.dataset.value = opt.value;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        selectOption(opt.value, opt.label);
      });
      list.appendChild(item);
    });
  }

  function selectOption(value, label) {
    currentValue = value;
    input.value = label;
    close();
    if (typeof onSelect === "function") onSelect(value, label);
  }

  function open() {
    isOpen = true;
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    container.classList.add("is-open");
  }

  function close() {
    isOpen = false;
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    container.classList.remove("is-open");
  }

  // Filter on input
  input.addEventListener("input", () => {
    const query = input.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    filteredOptions = options.filter(opt =>
      opt.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query)
    );
    renderList();
    if (!isOpen) open();
  });

  // Open on focus
  input.addEventListener("focus", () => {
    filteredOptions = [...options];
    renderList();
    open();
  });

  // Close on blur (delayed to allow mousedown on item)
  input.addEventListener("blur", () => {
    setTimeout(() => {
      close();
      // Restore label if user typed but didn't select
      if (currentValue) {
        const found = options.find(o => o.value === currentValue);
        input.value = found ? found.label : "";
      } else {
        input.value = "";
      }
    }, 150);
  });

  // Keyboard navigation
  input.addEventListener("keydown", (e) => {
    const items = list.querySelectorAll(".search-dropdown__item");
    const active = list.querySelector(".search-dropdown__item:hover") || list.querySelector(".search-dropdown__item.is-focused");
    let idx = Array.from(items).indexOf(active);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) { filteredOptions = [...options]; renderList(); open(); }
      idx = Math.min(idx + 1, items.length - 1);
      items.forEach(i => i.classList.remove("is-focused"));
      if (items[idx]) items[idx].classList.add("is-focused");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
      items.forEach(i => i.classList.remove("is-focused"));
      if (items[idx]) items[idx].classList.add("is-focused");
    } else if (e.key === "Enter" && isOpen) {
      e.preventDefault();
      if (active) active.dispatchEvent(new Event("mousedown"));
    } else if (e.key === "Escape") {
      close();
    }
  });

  // Public API
  renderList();

  return {
    setOptions(newOptions) {
      options = [...newOptions];
      filteredOptions = [...options];
      if (currentValue && !options.find(o => o.value === currentValue)) {
        currentValue = "";
        input.value = "";
      }
      renderList();
    },
    setValue(val) {
      currentValue = val;
      const found = options.find(o => o.value === val);
      input.value = found ? found.label : "";
    },
    getValue() {
      return currentValue;
    },
    reset() {
      currentValue = "";
      input.value = "";
      filteredOptions = [...options];
      renderList();
    },
    disable() {
      input.disabled = true;
      container.classList.add("is-disabled");
    },
    enable() {
      input.disabled = false;
      container.classList.remove("is-disabled");
    },
    getInput() { return input; }
  };
}
