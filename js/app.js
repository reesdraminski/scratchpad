const DELAY = 300; // the input delay time
const TAB = "&#009";

const notesEl = document.getElementById("notepad"); // notepad DOM reference
const navEl = document.getElementById("nav");
const addNoteTab = document.getElementById("addNoteTab");

const hasLocalStorage = checkForLocalStorage();
const data = hasLocalStorage ? JSON.parse(localStorage.getItem("notes") || "{}") : {};
let timeout = 0;

/**
 * Initialize the UI components on page load.
 */
(function initUI() {
    // attach key listener for shortcut keys
    bindShortcuts();

    // if there are no notes saved
    if (!data.notes)
    {
        // create a blank note and set it as last active
        data.notes = [{
            content: "",
            title: "Note #1",
        }];
        data.activeIndex = 0;
    }

    // render the note tabs and show the current note on the pad
    renderNotes();

    // bind add note button functionality
    addNoteTab.onclick = e => {
        // prevent hash being appended to URL
        e.preventDefault();

        // add new blank note
        data.notes.push({
            content: "",
            title: `Note #${data.notes.length + 1}`
        });

        // show the newly created note
        data.activeIndex = data.notes.length - 1;

        // force save of note
        saveApplicationState();

        // re-render note tabs
        renderNotes();
    }

    // autosave notes
    notesEl.oninput = () => {
        // if new typing, clear previous delay
        clearTimeout(timeout);

        // set save to localStorage to constant delay time
        timeout = setTimeout(() => {
            // update the note content of the active note
            data.notes[data.activeIndex].content = notesEl.innerHTML;

            // save the updated note state
            saveApplicationState();
        }, DELAY);
    }
})();

/**
 * Render the note tabs.
 */
function renderNotes() {
    // show the currently active note
    notesEl.innerHTML = data.notes[data.activeIndex]?.content;

    // delete the note tabs so they can be re-rendered
    [...nav.children]
        .filter(x => x.id != "addNoteTab")
        .forEach(x => x.remove());

    // create tabs for all of the saved notes
    data.notes
        .forEach((x, i) => {
            // create the note tab list item
            const tab = document.createElement("li");
            tab.classList.add("nav-item");

            tab.onclick = e => {
                // prevent hash being appended to URL
                e.preventDefault();

                // if not clicking on the already active tab
                if (data.activeIndex != i)
                {
                    // set the clicked tab as active
                    data.activeIndex = i;

                    // save state since the activeIndex changed
                    saveApplicationState();

                    // re-render the note tabs
                    renderNotes();
                }
            }

            tab.ondblclick = () => {
                // prompt the user for a title
                const title = prompt("What would you like to title this note?");

                // if the user actually entered a title
                if (title)
                {
                    // update the title
                    data.notes[i].title = title;

                    // save the updated title
                    saveApplicationState();

                    // re-render the note tabs
                    renderNotes();
                }
            }

            // create the tab title text link element
            const title = document.createElement("a");
            title.classList.add("nav-link");
            title.textContent = x.title;

            // show the last active tab as active
            if (i == data.activeIndex) 
            {
                title.classList.add("active");
            }

            tab.appendChild(title);

            // create the close button
            const close = document.createElement("button");
            close.classList.add("btn-close");

            close.onclick = e => {
                // capture only the close button click and not tab click
                e.stopPropagation();

                // shift left if closing a tab before the current tab OR
                // if closing the current tab that is non-first
                if (i < data.activeIndex || i == data.activeIndex && i !== 0)
                {
                    data.activeIndex--;
                }

                // delete the note
                data.notes.splice(i, 1);

                // if the user deleted the last note, create a new one
                if (data.notes.length === 0)
                {
                    // add a blank note
                    data.notes.push({
                        content: "",
                        title: "Note #1"
                    });
                }

                // save state since notes data changed
                saveApplicationState();

                // re-render note tabs
                renderNotes();
            }

            title.appendChild(close);

            // insert the tab into the tab list
            navEl.insertBefore(tab, addNoteTab);
        });

    // scroll to top of textarea delay 1ms to allow value to be set
    setTimeout(() => notesEl.scrollTop = 0, 1);

    notesEl.focus();
}

/**
 * Bind shortcut keys.
 */
function bindShortcuts() {
    notesEl.onclick = e => {
        // if the user clicked on a link
        if (e.target.tagName == "A") 
        {
            // open link in new window
            e.target.target = "_blank";

            // make the notepad uneditable so the link can get clicked
            notesEl.contentEditable = false;

            // delay making the notepad editable to allow for link click 
            setTimeout(() => { notesEl.contentEditable = true; });
        }
    }

    notesEl.onkeydown = async (e) => {
        // Tab
        if (e.key == "Tab") 
        {
            e.preventDefault();

            document.execCommand("insertHTML", false, TAB);
        }
        // Ctrl/Cmd + K
        else if (e.metaKey && e.key === "k") 
        {
            // get selected text
            let selectedText = getSelectionText();

            // read the clipboard
            let clipboardText = await navigator.clipboard.readText();

            // if the user is trying to create a link from a URL in notes
            if (isValidURL(selectedText))
            {
                document.execCommand("createLink", false, selectedText);
            }
            // if the user has a valid URL in clipboard and is highlighting regular text
            else if (isValidURL(clipboardText)) 
            {
                document.execCommand("createLink", false, clipboardText);
            }
        }
        // Ctrl/Cmd + U
        else if (e.metaKey && e.key === "u") 
        {
            document.execCommand("underline");
        }
        // Ctrl/Cmd + Shift + L
        else if (e.metaKey && e.shiftKey && e.key === "l") 
        {
            e.preventDefault();
            document.execCommand("insertHTML", false, "<hr/>");
        }
    }
}

/**
 * Get the user highlighted text.
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
 * Check if a string is a valid URL.
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
 * Save the application state to localStorage.
 */
function saveApplicationState() {
    localStorage.setItem("notes", JSON.stringify(data));
}

/**
 * Check if localStorage exist and is available.
 * https://stackoverflow.com/questions/16427636/check-if-localstorage-is-available/16427747
 * @return {Boolean} localStorageExists
 */
function checkForLocalStorage(){
    const test = "test";

    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);

        return true;
    } catch(e) {
        return false;
    }
}