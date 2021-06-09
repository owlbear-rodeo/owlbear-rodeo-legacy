function usePreventSelect() {
  function preventSelect() {
    document.body.classList.add("no-select");
  }

  function resumeSelect() {
    document.body.classList.remove("no-select");
  }

  return [preventSelect, resumeSelect];
}

export default usePreventSelect;
