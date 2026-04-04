(function () {
  const APP_VERSION = "20260404-5";

  function versionedPath(path) {
    return `${path}?v=${APP_VERSION}`;
  }

  function loadStyle(path) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = versionedPath(path);
    document.head.appendChild(link);
  }

  function loadScript(path) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = versionedPath(path);
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function loadScripts(paths) {
    return paths.reduce((chain, path) => {
      return chain.then(() => loadScript(path));
    }, Promise.resolve());
  }

  window.AppAssets = {
    version: APP_VERSION,
    loadStyle,
    loadScripts,
    versionedPath,
  };
})();
