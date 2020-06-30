const notesEl = document.getElementById("notepad"); // notepad DOM reference
const DELAY = 300; // the input delay time
const TAB = "&#009";

// attach key listener for shortcut keys
bindShortcuts();

// if localStorage is available
if (typeof(Storage) !== "undefined") {
    // get the notes from localStorage and put it into notes textarea
    notesEl.innerHTML = localStorage.getItem("notes");

    // scroll to top of textarea delay 1ms to allow value to be set
    setTimeout(() => notesEl.scrollTop = 0, 1);

    // start autosaving input
    autosave();
}

function bindShortcuts() {
    notesEl.onclick = e => {
        // if the user clicked on a link
        if (e.target.tagName == "A") {
            // open link in new window
            e.srcElement.target = "_blank";

            // make the notepad uneditable so the link can get clicked
            notesEl.contentEditable = false;

            // delay making the notepad editable to allow for link click 
            setTimeout(() => { notesEl.contentEditable = true; });
        }
    }

    notesEl.onkeydown = async (e) => {
        // Tab
        if (e.key == "Tab") {
            e.preventDefault();

            document.execCommand("insertHTML", false, TAB);
        }
        // Ctrl/Cmd + K
        else if (e.metaKey && e.key === "k") {
            // get selected text
            let selectedText = getSelectionText();

            // read the clipboard
            let clipboardText = await navigator.clipboard.readText();

            // if the user has a valid URL in clipboard and is highlighting regular text
            if (isValidURL(clipboardText) && !isValidURL(selectedText)) {
                document.execCommand("createLink", false, clipboardText);
            }
            // if the user is trying to create a link from a URL in notes
            else if (isValidURL(selectedText)){
                document.execCommand("createLink", false, selectedText);
            }
        }
        // Ctrl/Cmd + U
        else if (e.metaKey && e.key === "u") {
            document.execCommand("underline");
        }
        // Ctrl/Cmd + Shift + L
        else if (e.metaKey && e.shiftKey && e.key === "l") {
            e.preventDefault();
            document.execCommand("insertHTML", false, "<hr/>");
        }
    }
}

/**
 * https://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
 * @returns {String} selectedText
 */
function getSelectionText() {
    let text = "";

    if (window.getSelection) {
        text = window.getSelection().toString();
    } 
    else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }

    return text;
}

/**
 * 
 * @param {String} str 
 * @returns {Boolean} isValidURL
 */
function isValidURL(str) {
    const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator

    return !!pattern.test(str);
}

/**
 * On textarea input (typing), delay the input by constant delay time to 
 * prevent spamming localStorage.
 */
let timeout = 0;
function autosave() {
    notesEl.oninput = () => {
        // if new typing, clear previous delay
        clearTimeout(timeout);

        // set save to localStorage to constant delay time
        timeout = setTimeout(() => localStorage.setItem("notes", notesEl.innerHTML), DELAY);
    }
}