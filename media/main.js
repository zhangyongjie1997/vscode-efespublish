// @ts-nocheck

(function () {
  const vscode = acquireVsCodeApi();
  const messageEl = document.getElementById("message");
  const watcherList = document.getElementById("watcher-list");
  
  window.onerror = function(e){
		messageEl.innerText = JSON.stringify(e);
  };

  /** @type {Array<{ value: string }>} */
  // let watchers = oldState.watcher;

  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "updateWatcher": {
        updateWatcher(message.data);
        break;
			}
			case "addWatcher": {
				addWatcher(message.data);
				break;
			}
      case "clearWatcher": {
        watchers = [];
        updateWatcherList(colors);
        break;
      }
    }
  });

  watcherList.addEventListener("click", function(e /** @type {Event} */) {
    const target = e.target;
    switch (true){
      case target.classList.contains("watcher-btn"): {
        onWatcherStopClick(target);
        break;
      }
      case target.classList.contains("watcher-input"): {
        
        break;
      }
    }
  });

  /**
   * 
   * @param {{path: string, root: string, workDir: string}} watcher
   */
  function createWatcherItem(watcher) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    const button = document.createElement("button");
    li.classList.add("watcher-entry");
    span.classList.add("watcher-input");
    span.dataset.path = watcher.path;
    span.innerText = watcher.name;
    span.dataset.path = watcher.path;
    button.classList.add("watcher-btn");
    button.innerText = "stop";
    button.dataset.path = watcher.path;
    li.appendChild(span);
    li.appendChild(button);
    return li;
  }

  /**
   * @param {HTMLButtonElement} target 
   */
  function onWatcherStopClick(target){
    const path = target.dataset.path;
    vscode.postMessage({type: "stopWatcher", data: path});
    target.parentElement.remove();
  }

  /**
   * @param {string} color
   */
	function onWatcherSpanClicked(color) {

  }
  
  /**
   * @param {{path: string, root: string, workDir: string}} newWatcher 
   */
	function addWatcher(newWatcher){
    const item = createWatcherItem(newWatcher);
    watcherList.appendChild(item);
	}

  function updateWatcher() {
    updateWatcherList(colors);
  }
})();
