/* Selly - editor.js
   Simplified in-page design editor demo (social-media.html).
   Functional scope: document size, elements (layers), text, shapes.
   Photos/Uploads rails are intentionally non-functional. */

(function () {
  const editor = document.getElementById("socialEditor");
  if (!editor) return;

  // 1. DOM references
  const page = document.getElementById("editorPage");
  const layersList = document.getElementById("editorLayers");
  const layersEmpty = document.getElementById("editorLayersEmpty");
  const docSizeSelect = document.getElementById("editorDocSize");
  const selectionBlock = document.getElementById("editorSelection");
  const swatches = document.getElementById("editorSwatches");
  const deleteButton = document.getElementById("editorDelete");
  const railButtons = editor.querySelectorAll("[data-editor-panel]");
  const panelViews = editor.querySelectorAll("[data-panel-view]");

  // 2. State
  let elements = []; // { id, node, label }
  let selectedId = null;
  let idCounter = 0;

  const TEXT_PRESETS = {
    heading: { label: "Heading", text: "Under\nContract", className: "editor-el--heading" },
    subheading: { label: "Subheading", text: "3 Bedrooms | 2 Bathrooms | 1,850 Sq Ft", className: "editor-el--subheading" },
    body: { label: "Body text", text: "Selly", className: "editor-el--body" },
  };
  const SHAPE_LABELS = { rect: "Rectangle", circle: "Circle", pill: "Pill", line: "Line" };

  // 3. Panel switching (left rail)
  function activatePanel(name) {
    railButtons.forEach((btn) => {
      const active = btn.dataset.editorPanel === name;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    panelViews.forEach((view) => {
      view.classList.toggle("is-active", view.dataset.panelView === name);
    });
  }

  // 4. Selection
  function select(id) {
    selectedId = id;
    elements.forEach(({ id: elId, node }) => {
      node.classList.toggle("is-selected", elId === id);
    });
    renderLayers();
    selectionBlock.hidden = id === null;
  }

  // 5. Layers panel
  function renderLayers() {
    layersList.innerHTML = "";
    layersEmpty.hidden = elements.length > 0;
    elements.forEach(({ id, label }) => {
      const item = document.createElement("li");
      item.className = "editor__layer" + (id === selectedId ? " is-selected" : "");
      item.innerHTML = `<span>${label}</span><button class="editor__layer-remove" type="button" aria-label="Remove ${label}">&times;</button>`;
      item.addEventListener("click", (event) => {
        if (event.target.closest(".editor__layer-remove")) {
          removeElement(id);
        } else {
          select(id);
        }
      });
      layersList.appendChild(item);
    });
  }

  // 6. Element creation
  function addElement(node, label) {
    const id = ++idCounter;
    node.classList.add("editor-el");
    node.dataset.editorId = id;
    if (!node.style.left) {
      // stagger initial placement so stacked adds stay visible
      node.style.left = 24 + (elements.length % 5) * 18 + "px";
      node.style.top = 24 + (elements.length % 5) * 18 + "px";
    }
    page.appendChild(node);
    elements.push({ id, node, label });
    makeDraggable(node, id);
    select(id);
  }

  function addText(kind, options = {}) {
    const preset = TEXT_PRESETS[kind];
    const node = document.createElement("div");
    node.className = `editor-el--text ${preset.className}`;
    node.textContent = options.text ?? preset.text;
    if (options.position) Object.assign(node.style, options.position);
    node.addEventListener("dblclick", () => {
      node.contentEditable = "true";
      node.focus();
      document.getSelection().selectAllChildren(node);
    });
    node.addEventListener("blur", () => {
      node.contentEditable = "false";
    });
    addElement(node, preset.label);
  }

  function addShape(kind) {
    const node = document.createElement("div");
    node.className = `editor-el--${kind}`;
    node.style.background = "#111827";
    addElement(node, SHAPE_LABELS[kind]);
  }

  function removeElement(id) {
    const index = elements.findIndex((el) => el.id === id);
    if (index === -1) return;
    elements[index].node.remove();
    elements.splice(index, 1);
    select(selectedId === id ? null : selectedId);
  }

  // 7. Dragging (kept inside the page bounds)
  function makeDraggable(node, id) {
    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;

    node.addEventListener("pointerdown", (event) => {
      if (node.isContentEditable) return;
      event.preventDefault();
      select(id);
      startX = event.clientX;
      startY = event.clientY;
      originLeft = node.offsetLeft;
      originTop = node.offsetTop;
      node.setPointerCapture(event.pointerId);

      const move = (ev) => {
        const maxLeft = page.clientWidth - node.offsetWidth;
        const maxTop = page.clientHeight - node.offsetHeight;
        node.style.left = Math.min(Math.max(originLeft + ev.clientX - startX, 0), Math.max(maxLeft, 0)) + "px";
        node.style.top = Math.min(Math.max(originTop + ev.clientY - startY, 0), Math.max(maxTop, 0)) + "px";
      };
      const up = () => {
        node.removeEventListener("pointermove", move);
        node.removeEventListener("pointerup", up);
      };
      node.addEventListener("pointermove", move);
      node.addEventListener("pointerup", up);
    });
  }

  // 8. Inspector actions
  function applyColor(color) {
    const selected = elements.find((el) => el.id === selectedId);
    if (!selected) return;
    if (selected.node.classList.contains("editor-el--text")) {
      selected.node.style.color = color;
    } else {
      selected.node.style.background = color;
    }
  }

  // 9. Events
  railButtons.forEach((btn) => {
    btn.addEventListener("click", () => activatePanel(btn.dataset.editorPanel));
  });

  editor.querySelectorAll("[data-add-text]").forEach((btn) => {
    btn.addEventListener("click", () => addText(btn.dataset.addText));
  });

  editor.querySelectorAll("[data-add-shape]").forEach((btn) => {
    btn.addEventListener("click", () => addShape(btn.dataset.addShape));
  });

  docSizeSelect.addEventListener("change", () => {
    page.dataset.size = docSizeSelect.value;
  });

  swatches.addEventListener("click", (event) => {
    const swatch = event.target.closest(".editor__swatch");
    if (swatch) applyColor(swatch.dataset.color);
  });

  deleteButton.addEventListener("click", () => {
    if (selectedId !== null) removeElement(selectedId);
  });

  page.addEventListener("pointerdown", (event) => {
    if (event.target === page) select(null);
  });

  document.addEventListener("keydown", (event) => {
    if ((event.key === "Delete" || event.key === "Backspace") && selectedId !== null) {
      const selected = elements.find((el) => el.id === selectedId);
      if (selected && !selected.node.isContentEditable) {
        event.preventDefault();
        removeElement(selectedId);
      }
    }
  });

  // 10. Seed the base design ("Under Contract" post).
  //     The photo is part of the layout — fixed, not selectable or movable.
  function seedBaseDesign() {
    const photo = document.createElement("img");
    photo.className = "editor-el--photo";
    photo.src = "assets/images/editor-photo.png";
    photo.alt = "";
    photo.draggable = false;
    page.appendChild(photo);

    addText("heading", { position: { left: "5.5%", top: "6%" } });
    addText("subheading", { position: { left: "5.5%", top: "29.5%" } });
    addText("body", { text: "Selly", position: { left: "4%", top: "94%" } });
    addText("body", { text: "2026", position: { left: "88%", top: "94%" } });
  }

  seedBaseDesign();
  select(null);
})();
