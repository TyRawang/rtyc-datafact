/** Applies the saved theme before first paint so dark mode does not flash. */
export function ThemeScript() {
  const code = `try{var t=localStorage.getItem("fgt-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
