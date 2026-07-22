// Developed By: Vishnukarthick K

// Print the page with a blanked document title, so the browser's print header
// doesn't show "Mount Carmel College — Student Portal". (The date / URL / page
// number in that header are controlled by the browser's own "Headers and footers"
// print setting and can't be removed from code.)
export function printPage() {
  const original = document.title;
  document.title = " ";
  const restore = () => {
    document.title = original;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
