window.addEventListener('DOMContentLoaded', async () => {
  try {

    const textarea = document.getElementById('note');
    const saveBtn = document.getElementById('save');
    const deleteBtn = document.getElementById('deleteBtn');
    const saveAsBtn = document.getElementById('save-as');
    const newNoteBtn = document.getElementById('new-note');
    const openFileBtn = document.getElementById('open-file');
    const statusEl = document.getElementById('save_status');

    let currentFilePath = null;

    // Load Saved Note
    const savedNote = await window.electronAPI.loadNote();
    textarea.value = savedNote || '';

    let lastSavedText = textarea.value;

    // Manual Save
    saveBtn.addEventListener('click', async () => {
      try {

        const result = await window.electronAPI.smartSave(
          textarea.value,
          currentFilePath
        );

        lastSavedText = textarea.value;
        currentFilePath = result.filePath;

        statusEl.textContent = `Saved to: ${result.filePath}`;

      } catch (error) {
        console.error('Save Error:', error);
        statusEl.textContent = 'Save failed!';
      }
    });

    // Save As
    saveAsBtn.addEventListener('click', async () => {
      try {

        const result = await window.electronAPI.saveAs(textarea.value);

        if (result.success) {
          lastSavedText = textarea.value;
          currentFilePath = result.filePath;

          statusEl.textContent = `Saved to: ${result.filePath}`;
        } else {
          statusEl.textContent = 'Save As cancelled';
        }

      } catch (error) {
        console.error('Save As Error:', error);
        statusEl.textContent = 'Save As failed!';
      }
    });

    // New Note
    newNoteBtn.addEventListener('click', async () => {
      try {

        if (textarea.value === lastSavedText) {
          textarea.value = '';
          lastSavedText = '';
          currentFilePath = null;

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

      } catch (error) {
        console.error('New Note Error:', error);
        statusEl.textContent = 'New note failed!';
      }
    });

    // Open File
    openFileBtn.addEventListener('click', async () => {
      try {

        const result = await window.electronAPI.openFile();

        if (result.success) {
          textarea.value = result.content;
          lastSavedText = result.content;
          currentFilePath = result.filePath;

          statusEl.textContent = `Opened: ${result.filePath}`;
        } else {
          statusEl.textContent = 'Open cancelled.';
        }

      } catch (error) {
        console.error('Open File Error:', error);
        statusEl.textContent = 'Open failed!';
      }
    });

    // Auto Save
    async function autoSave() {
      try {

        const currentText = textarea.value;

        if (currentText === lastSavedText) return;

        const result = await window.electronAPI.smartSave(
          currentText,
          currentFilePath
        );

        lastSavedText = currentText;
        currentFilePath = result.filePath;

        const now = new Date().toLocaleTimeString();

        statusEl.textContent = `Auto-saved at ${now}`;

      } catch (error) {
        console.error('Auto Save Error:', error);
        statusEl.textContent = 'Auto-save failed!';
      }
    }

    let debounceTimer;

    textarea.addEventListener('input', () => {

      statusEl.textContent =
        'Changes detected - auto-saving in 5s...';

      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(autoSave, 5000);
    });

    // Delete
    deleteBtn.addEventListener('click', async () => {
      try {

        const confirmed = confirm(
          'Really delete all notes? This cannot be undone!'
        );

        if (confirmed) {

          await window.electronAPI.deleteNote();

          textarea.value = '';
          lastSavedText = '';
          currentFilePath = null;

          statusEl.textContent = 'All notes deleted!';
        }

      } catch (error) {
        console.error('Delete Error:', error);
        statusEl.textContent = 'Delete failed!';
      }
    });

    // Menu Actions
    window.electronAPI.onMenuAction('menu-new-note', () => {
      newNoteBtn.click();
    });

    window.electronAPI.onMenuAction('menu-open-file', () => {
      openFileBtn.click();
    });

    window.electronAPI.onMenuAction('menu-save', () => {
      saveBtn.click();
    });

    window.electronAPI.onMenuAction('menu-save-as', () => {
      saveAsBtn.click();
    });

  } catch (error) {
    console.error('Startup Error:', error);
  }
});