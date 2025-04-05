export function initTheme() {
  const html = document.documentElement;

  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  if (savedTheme) {
    html.setAttribute("data-theme", savedTheme);
  } else if (systemPrefersDark) {
    html.setAttribute("data-theme", "dark");
  }

  // Add click handler to the Silva logo
  document.addEventListener("click", (event) => {
    const silvaLogo = event.target.closest(".silva-logo");
    if (silvaLogo) {
      const currentTheme = html.getAttribute("data-theme");
      const newTheme = currentTheme === "light" ? "dark" : "light";

      html.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    }
  });
}
