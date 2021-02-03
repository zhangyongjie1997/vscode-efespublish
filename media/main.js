// @ts-nocheck

(function () {
  const vscode = acquireVsCodeApi();
  const messageEl = document.getElementById('message');
  const watcherList = document.getElementById('watcher-list');

  window.onerror = function (e) {
    messageEl.innerText = JSON.stringify(e);
  };

  /** @type {Array<{ value: string }>} */
  // let watchers = oldState.watcher;

  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.type) {
      case 'updateWatcher': {
        updateWatcher(message.data);
        break;
      }
      case 'addWatcher': {
        addWatcher(message.data);
        break;
      }
      case 'clearWatcher': {
        watchers = [];
        updateWatcherList(colors);
        break;
      }
    }
  });

  watcherList.addEventListener('click', (e /** @type {Event} */) => {
    const { target } = e;
    switch (true) {
      case target.classList.contains('watcher-btn-stop'):
        onWatcherStopClick(target);
        break;
      case target.classList.contains('watcher-btn-publish'):
        onWatcherPublishClick(target);
        break;
    }
  });

  /**
   *
   * @param {{path: string, root: string, workDir: string}} watcher
   */
  function createWatcherItem(watcher) {
    const li = document.createElement('li');
    const div = document.createElement('div');
    const button = document.createElement('button');
    const button2 = document.createElement('button');
    li.classList.add('watcher-entry');
    div.classList.add('watcher-input');
    div.dataset.path = watcher.path;
    div.innerText = watcher.name;
    div.dataset.path = watcher.path;
    button.classList.add('watcher-btn');
    button.classList.add('watcher-btn-stop');
    button.innerText = 'stop';
    button.dataset.path = watcher.path;
    button2.classList.add('watcher-btn');
    button2.classList.add('watcher-btn-publish');
    button2.innerText = 'publish';
    button2.dataset.workdir = watcher.workDir;
    li.appendChild(div);
    li.appendChild(button);
    li.appendChild(button2);
    return li;
  }

  /**
   * @param {HTMLButtonElement} target
   */
  function onWatcherStopClick(target) {
    const { path } = target.dataset;
    vscode.postMessage({ type: 'stopWatcher', data: path });
    target.parentElement.remove();
  }

  /**
   *
   * @param {HTMLButtonElement} target
   */
  function onWatcherPublishClick(target) {
    const workDir = target.dataset.workdir;
    vscode.postMessage({ type: 'publish', data: workDir });
  }

  /**
   * @param {string} color
   */
  function onWatcherSpanClicked(color) {

  }

  /**
   * @param {{path: string, root: string, workDir: string}} newWatcher
   */
  function addWatcher(newWatcher) {
    const item = createWatcherItem(newWatcher);
    watcherList.appendChild(item);
  }

  function updateWatcher() {
    updateWatcherList(colors);
  }
})();
