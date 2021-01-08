// @ts-nocheck

(function () {
  const vscode = acquireVsCodeApi();

  const messageEl = document.getElementById("message");
  const btn = document.getElementById("btn");
  messageEl.innerText = "aaaa";
  btn.addEventListener("click", () => {
    vscode.postMessage({type: 1});
  });
  
  console.log("aaaaa");

  /** @type {Array<{ value: string }>} */
  let watchers = oldState.watcher;

  window.addEventListener("message", (event) => {
    const message = event.data;
    vscode.postMessage({ type: '1' });
		messageEl.innerText = message;
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

  /**
   * @param {Array<{ value: string }>} colors
   */
  function updateWatcherList(colors) {
    const ul = document.querySelector(".color-list");
    ul.textContent = "";
    for (const color of colors) {
      const li = document.createElement("li");
      li.className = "color-entry";

      const colorPreview = document.createElement("div");
      colorPreview.className = "color-preview";
      colorPreview.style.backgroundColor = `#${color.value}`;
      colorPreview.addEventListener("click", () => {
        onWatcherClicked(color.value);
      });
      li.appendChild(colorPreview);

      const input = document.createElement("input");
      input.className = "color-input";
      input.type = "text";
      input.value = color.value;
      input.addEventListener("change", (e) => {
        const value = e.target.value;
        if (!value) {
          // Treat empty value as delete
          colors.splice(colors.indexOf(color), 1);
        } else {
          color.value = value;
        }
        updateWatcherList(colors);
      });
      li.appendChild(input);

      ul.appendChild(li);
    }
  }

  /**
   * @param {string} color
   */
	function onWatcherClicked(color) {}
	
	function addWatcher(newWatcher){
		console.log(newWatcher);
	}

  function updateWatcher() {
    updateWatcherList(colors);
  }
})();
