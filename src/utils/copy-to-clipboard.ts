export function copyToClipboard(text: string) {
    // Create a temporary textarea element
    var textArea = document.createElement("textarea");

    // Set the text value to be copied
    textArea.value = text;

    // Make the textarea element offscreen
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";

    // Add the textarea element to the document
    document.body.appendChild(textArea);

    // Select the text in the textarea element
    textArea.select();

    // Copy the selected text to the clipboard
    document.execCommand("copy");

    // Remove the textarea element from the document
    document.body.removeChild(textArea);

    // Alert the user that the text has been copied
    alert("Text copied to clipboard!");
}
