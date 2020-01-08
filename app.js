const notesEl = document.getElementById("notepad"); // notepad DOM reference
const DELAY = 300; // the input delay time
const TAB = "     "; // 5 space tab

// attach key listener for shortcut keys
bindShortcuts();

// if localStorage is available
if (typeof(Storage) !== "undefined") {
    // get the notes from localStorage and put it into notes textarea
    notesEl.innerHTML = localStorage.getItem("notes");

    // Scroll to top of textarea delay 1ms to allow value to be set
    setTimeout(() => {
        notesEl.scrollTop = 0;
    }, 1);

    // start autosaving input
    autosave();
}

function bindShortcuts() {
    notesEl.addEventListener('click', (e) => {
        // if the user clicked on a link
        if (e.target.tagName == "A") {
            // open link in new window
            e.srcElement.target = "_blank";

            // make the notepad uneditable so the link can get clicked
            notesEl.contentEditable = false;

            // delay making the notepad editable to allow for link click 
            setTimeout(() => { notesEl.contentEditable = true; });
        }
    });

    notesEl.addEventListener('keydown', (e) => {
        // https://stackoverflow.com/questions/11076975/insert-text-into-textarea-at-cursor-position-javascript
        if (e.key == "Tab") {
            // don't tab as normally
            e.preventDefault();

            // get cursor position
            let start = notesEl.selectionStart;
            let end = notesEl.selectionEnd;

            // get text before and after cursor
            let text = notesEl.value;
            let before = text.substring(0, start);
            let after = text.substring(end, text.length);

            // add tab to notepad value
            notesEl.value = (before + TAB + after);

            // move the cursor to after the tab
            notesEl.selectionStart = notesEl.selectionEnd = start + TAB.length;

            // refocus onto notepad
            notesEl.focus();
        }
        // Ctrl/Cmd + U
        else if (e.metaKey && e.key === "u") {
            document.execCommand("underline");
        }
        // Ctrl/Cmd + K
        else if (e.metaKey && e.key === "k") {
            document.execCommand("createLink", false, getSelectionText());
        }
        // Ctrl/Cmd + Shift + L
        else if (e.metaKey && e.shiftKey && e.key === "l") {
            e.preventDefault();
            document.execCommand("insertHTML", false, "<hr/>");
        }
    });
}

/**
* https://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
*/
function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

/**
* On textarea input (typing), delay the input by constant delay time to 
* prevent spamming localStorage.
*/
let timeout = 0;
function autosave() {
    notesEl.addEventListener("input", () => {
        // if new typing, clear previous delay
        clearTimeout(timeout);

        // set save to localStorage to constant delay time
        timeout = setTimeout(() => {
            localStorage.setItem("notes", notesEl.innerHTML);
        }, DELAY);
    });
}