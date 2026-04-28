window.addEventListener('DOMContentLoaded', async () => {
  const textarea = document.getElementById('note');
  const saveBtn = document.getElementById('save');
  const deleteBtn = document.getElementById('deleteBtn');
  const saveAsBtn = document.getElementById('save-as');
  const newNoteBtn = document.getElementById('new-note');
  const openFileBtn = document.getElementById('open-file');
  const statusEl = document.getElementById('save_status');

  let currentFilePath = null;

  const savedNote = await window.electronAPI.loadNote();
  textarea.value = savedNote;
  let lastSavedText = textarea.value;

  // Manual Save
  saveBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.smartSave(textarea.value, currentFilePath);
    lastSavedText = textarea.value;
    currentFilePath = result.filePath;
    statusEl.textContent = `Saved to: ${result.filePath}`;
  });

  // Save As
  saveAsBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.saveAs(textarea.value);

    if (result.success) {
      lastSavedText = textarea.value;
      currentFilePath = result.filePath;
      statusEl.textContent = `Saved to: ${result.filePath}`;
    } else {
      statusEl.textContent = 'Save As cancelled';
    }
  });

  // New Note
  newNoteBtn.addEventListener('click', async () => {
    if (textarea.value === lastSavedText) {
      textarea.value = '';
      lastSavedText = '';
      statusEl.textContent = 'New note started';
      return;
    }

    const result = await window.electronAPI.newNote();

    if (result.confirmed) {
      textarea.value = '';
      lastSavedText = '';
      currentFilePath = null;
      statusEl.textContent = 'New note started.';
    } else {
      statusEl.textContent = 'New note cancelled.';
    }
  });

  // Open File
  openFileBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.openFile();

    if (result.success) {
      textarea.value = result.content;
      lastSavedText = result.content;
      currentFilePath = result.filePath;
      statusEl.textContent = `Opened: ${result.filePath}`;
    } else {
      statusEl.textContent = 'Open cancelled.';
    }
  });

  // Auto Save
  async function autoSave() {
    const currentText = textarea.value;

    if (currentText === lastSavedText) return;

    const result = await window.electronAPI.smartSave(currentText, currentFilePath);

    lastSavedText = currentText;
    currentFilePath = result.filePath;

    const now = new Date().toLocaleTimeString();
    statusEl.textContent = `Auto-saved at ${now}`;
  }

  let debounceTimer;

  textarea.addEventListener('input', () => {
    statusEl.textContent = 'Changes detected - auto-saving in 5s...';

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(autoSave, 5000);
  });

  // Delete
  deleteBtn.addEventListener('click', async () => {
    if (confirm('Really delete all notes? This cannot be undone!')) {
      await window.electronAPI.deleteNote();
      textarea.value = '';
      lastSavedText = '';
      currentFilePath = null;
      statusEl.textContent = 'All notes deleted!';
    }
  });
});