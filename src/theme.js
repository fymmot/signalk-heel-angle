export function initTheme() {
  const html = document.documentElement;
  const systemDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");

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

  // Listen for system theme changes if no user preference is saved
  systemDarkQuery.addEventListener("change", (e) => {
    const savedTheme = localStorage.getItem("theme");
    if (!savedTheme) {
      const newTheme = e.matches ? "dark" : "light";
      html.setAttribute("data-theme", newTheme);
    }
  });
}
