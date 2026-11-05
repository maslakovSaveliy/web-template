// Fixture for scripts/messages/plugin.test.mjs: every line marked HIT must be reported.
export const Hits = ({ name, count }: { name: string; count: number }) => (
  <div>
    <p>Welcome back, {name}</p>
    <p>{count} items left</p>
    <button type="button">Save (draft)</button>
    <a href="https://x.example">View source</a>
    <img alt="Cute cat" src="/x.png" />
    <input aria-label="Search" className="search-box" />
  </div>
);

export const Clean = ({ name }: { name: string }) => (
  <div className="wrapper">
    <p>{name}</p>
    <span> · </span>
    {/* biome-ignore lint/plugin/no-hardcoded-jsx-text: brand mark */}
    <b>Acme</b>
  </div>
);
