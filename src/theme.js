export function initTheme() {
  const html = document.documentElement;
  const systemDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function toggleTheme() {
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  }

  // Initialize theme from saved preference or system preference
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    html.setAttribute("data-theme", savedTheme);
  } else {
    const systemTheme = systemDarkQuery.matches ? "dark" : "light";
    html.setAttribute("data-theme", systemTheme);
  }

  // Add click handler to the theme toggle
  document.addEventListener("click", (event) => {
    const heelAngleText = event.target.closest(".heel-angle-text");
    if (heelAngleText) {
      toggleTheme();
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
