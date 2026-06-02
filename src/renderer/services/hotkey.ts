import hotkeyListener from "hotkey-listener"

hotkeyListener.register({
  element: window,
  keys: [
    "ctrl+w"
  ],
  eventOptions: {
    // Required to preventDefault() in chrome
    cancelable: true
  }
})

/**
  let isMenuOpen=false;

  window.addEventListener("keydown:ctrl+w", (event) => {
    event.preventDefault()
    console.log(`${event.detail.key} pushed`) // ctrl+w pressed
    if(!isMenuOpen){
      console.log("Open menu");
      isMenuOpen=true;
    }
  })
 * 
 */