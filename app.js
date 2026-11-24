const form = document.querySelector('#upload-form');
const zone = document.querySelector('#dropzone');
const input = document.querySelector('#resume');
const filename = document.querySelector('#file-name');
const hint = document.querySelector('#file-hint');
const announcement = document.querySelector('#announcement');
const title = document.querySelector('#panel-title');
const alternate = document.querySelector('#alternate');
const returnButton = document.querySelector('#return');
const steps = [...document.querySelectorAll('.steps li')];
let selected = null;
let dragDepth = 0;
const preview = document.querySelector('#preview');
const reader = document.querySelector('#reader');
const body = document.querySelector('#preview-body');
const pdfLink = document.querySelector('#pdf-link');
let objectUrl;

function clearPreview() {
  body.replaceChildren();
  pdfLink.hidden = true;
  pdfLink.removeAttribute('href');
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
}

preview.addEventListener('click', async () => {
  const file = selected;
  if (!file) return;
  clearPreview();
  document.querySelector('#preview-title').textContent = file.name;
  reader.showModal();
  const extension = file.name.split('.').pop().toLowerCase();
  const images = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
  const isPdf = file.type === 'application/pdf' || extension === 'pdf';
  if (isPdf || Object.hasOwn(images, extension)) {
    objectUrl = URL.createObjectURL(file.slice(0, file.size, isPdf ? 'application/pdf' : images[extension]));
    const content = document.createElement(isPdf ? 'iframe' : 'img');
    if (isPdf) {
      content.title = 'PDF preview: ' + file.name;
      pdfLink.href = objectUrl;
      pdfLink.hidden = false;
    } else {
      content.alt = file.name;
      content.onerror = () => { body.textContent = 'This image could not be displayed.'; };
    }
    content.src = objectUrl;
    body.append(content);
  } else if (extension === 'txt' || file.type === 'text/plain') {
    const text = document.createElement('pre');
    body.append(text);
    try {
      const limit = 256 * 1024;
      text.textContent = await file.slice(0, limit).text();
      if (file.size > limit) text.append('\n\n[Preview limited to the first 256 KB.]');
    } catch { text.textContent = 'This text file could not be read.'; }
  } else {
    const notice = document.createElement('p');
    notice.textContent = 'Preview is available for PDF, images and plain text. Your file is still selected.';
    body.append(notice);
  }
});
document.querySelector('#close-preview').addEventListener('click', () => reader.close());
reader.addEventListener('close', () => {
  if (!reader.open) clearPreview();
});

function selectFile(file) {
  if (!file) return;
  selected = file;
  filename.textContent = file.name;
  filename.hidden = false;
  preview.hidden = false;
  hint.textContent = 'Click or drop another file to replace it';
  announcement.textContent = 'Selected: ' + file.name;
}
input.addEventListener('change', () => selectFile(input.files[0]));
zone.addEventListener('dragenter', event => {
  event.preventDefault();
  dragDepth++;
  zone.classList.add('dragging');
});
zone.addEventListener('dragover', event => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
});
zone.addEventListener('dragleave', () => {
  if (--dragDepth <= 0) zone.classList.remove('dragging');
});
zone.addEventListener('drop', event => {
  event.preventDefault();
  dragDepth = 0;
  zone.classList.remove('dragging');
  const files = event.dataTransfer.files;
  if (files.length !== 1) {
    hint.textContent = 'Please choose one resume at a time';
    announcement.textContent = hint.textContent;
    return;
  }
  input.value = '';
  selectFile(files[0]);
});

function show(view) {
  const editing = view === 'upload';
  const previous = view === 'previous';
  title.textContent = editing ? 'Upload file' : previous ? 'Resume options' : 'Finished';
  form.hidden = !editing;
  alternate.hidden = editing;
  document.querySelector('#message').textContent = previous
    ? 'You can add a resume in the final step, or finish without one.'
    : selected ? 'Resume selected: ' + selected.name : 'Completed without a resume.';
  returnButton.textContent = previous ? 'Next step' : 'Back to upload';
  steps.forEach((item, i) => {
    const active = (editing && i === 2) || (previous && i === 1);
    const pending = previous && i === 2;
    item.textContent = active || pending ? String(i + 1) : '✓';
    item.classList.toggle('pending', pending);
    item.removeAttribute('aria-current');
    if (active) item.setAttribute('aria-current', 'step');
    item.setAttribute('aria-label', 'Step ' + (i + 1) + ', ' + (active ? 'current' : pending ? 'upcoming' : 'completed'));
  });
  title.focus();
}
form.addEventListener('submit', event => {
  event.preventDefault();
  show('finished');
});
document.querySelector('#back').addEventListener('click', () => show('previous'));
returnButton.addEventListener('click', () => show('upload'));
