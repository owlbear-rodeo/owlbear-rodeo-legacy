function usePreventSelect() {
  function clearSelection() {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    if (document.selection) {
      document.selection.empty();
    }
  }
  function preventSelect() {
    clearSelection();
    document.body.classList.add("no-select");
  }

  function resumeSelect() {
    document.body.classList.remove("no-select");
  }

  return [preventSelect, resumeSelect];
}

export default usePreventSelect;
