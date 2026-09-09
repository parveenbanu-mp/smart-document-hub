        const fileInput = document.getElementById("fileInput");
        const convertButton = document.getElementById("convertButton");
        const fileName = document.getElementById("fileName");
        const fileSize = document.getElementById("fileSize");
        const documentText = document.getElementById("documentText");
        const statusMessage = document.createElement("p");
        const progressContainer = document.getElementById("progressContainer");
        const progressBar = document.getElementById("progressBar");
        statusMessage.id = "statusMessage";
        statusMessage.textContent = "";
        documentText.parentNode.insertBefore(statusMessage, documentText);

        const downloadButton = document.getElementById("downloadButton");
        const clearButton = document.getElementById("clearButton");
        const copyButton = document.getElementById("copyButton");
        const downloadWordButton =
    document.getElementById("downloadWordButton");
        const wordCount = document.getElementById("wordCount");
        const charCount = document.getElementById("charCount");


        // ===============================
        // CONVERT DOCUMENT
        // ===============================

        convertButton.addEventListener("click", function () {

            if (fileInput.files.length === 0) {
                alert("Please select a document first.");
                return;
            }
            statusMessage.textContent = "⏳ Converting document... Please wait.";
            const file = fileInput.files[0];

            fileName.textContent = "Selected file: " + file.name;
            fileSize.textContent =
            "Size: " + (file.size / 1024).toFixed(2) + " KB";


            // ===============================
            // TXT FILE
            // ===============================

            if (file.type === "text/plain") {

                const reader = new FileReader();

                reader.onload = function (event) {
                    documentText.value = event.target.result;
    updateTextStats();
    statusMessage.textContent = "✅ Conversion completed!";
                };

                reader.readAsText(file);
            }


            // ===============================
            // PDF FILE
            // ===============================

            else if (file.type === "application/pdf") {

                const reader = new FileReader();

                reader.onload = function () {

                    const typedarray = new Uint8Array(reader.result);

                    pdfjsLib.getDocument(typedarray).promise
                    .then(function (pdf) {
                        let fullText = "";
                        let pagesProcessed = 0;

                        for (
                            let pageNumber = 1;
                            pageNumber <= pdf.numPages;
                            pageNumber++
                        ) {

                            pdf.getPage(pageNumber).then(function (page) {

                                page.getTextContent().then(function (textContent) {

                                    const pageText = textContent.items
                                        .map(item => item.str)
                                        .join(" ");

                                    fullText += pageText + "\n\n";

                                    pagesProcessed++;

                                    if (pagesProcessed === pdf.numPages) {
                                        documentText.value = fullText;
                                        updateTextStats();
                                        statusMessage.textContent = "✅ Conversion completed!";
                                    }

                                });

                            });

                        }

                    });

                };

                reader.readAsArrayBuffer(file);
            }


            // ===============================
            // DOCX FILE
            // ===============================

            else if (file.name.toLowerCase().endsWith(".docx")) {

                const reader = new FileReader();

                reader.onload = function (event) {

                    const arrayBuffer = event.target.result;

                    mammoth.extractRawText({
                        arrayBuffer: arrayBuffer
                    })

                    .then(function (result) {

                        documentText.value = result.value;
                        updateTextStats();
                        statusMessage.textContent = "✅ Conversion completed!";
                    
                    })  

                    .catch(function (error) {

                        console.error(error);

                        documentText.value =
                            "Unable to read the DOCX file.";

                    });

                };

                reader.readAsArrayBuffer(file);
            }


            // ===============================
            // IMAGE FILE
            // ===============================

            else if (file.type.startsWith("image/")) {

                documentText.value =
                    "Reading image... Please wait.";

                Tesseract.recognize(
                    file,
                    "eng",
                    {
                        logger: function (info) {

                            if (info.status === "recognizing text") {

                                progressContainer.style.display = "block";
        progressBar.style.width = Math.round(info.progress * 100) + "%";
                                documentText.value =
                                    "Reading image... " +
                                    Math.round(info.progress * 100) +
                                    "%";

                            }

                        }
                    }
                )

                .then(function (result) {

                    documentText.value = result.data.text;
                    updateTextStats();
                    progressBar.style.width = "100%";

        setTimeout(function () {
            progressContainer.style.display = "none";
            progressBar.style.width = "0%";
        }, 1000);
                    statusMessage.textContent = "✅ Conversion completed!";

                })

                .catch(function (error) {

                    console.error(error);

                    documentText.value =
                        "Unable to read the image.";

                });

            }


            // ===============================
            // UNSUPPORTED FILE
            // ===============================

            else {

                documentText.value =
                    "This file type is not supported yet.";

            }

        });


        // ===============================
        // DOWNLOAD TEXT
        // ===============================

        downloadButton.addEventListener("click", function () {

            const text = documentText.value;

            if (text.trim() === "") {

                alert("There is no text to download.");

                return;
            }

            const blob = new Blob(
                [text],
                { type: "text/plain" }
            );

            const link = document.createElement("a");

            link.href = URL.createObjectURL(blob);

            link.download =
                "converted-document.txt";

            link.click();

            URL.revokeObjectURL(link.href);

        });


        // ===============================
        // CLEAR
        // ===============================

        clearButton.addEventListener("click", function () {

            documentText.value = "";

            fileName.textContent = "";
            fileSize.textContent = "";

            fileInput.value = "";

            statusMessage.textContent = "";

            wordCount.textContent = "0";
            charCount.textContent = "0";

            progressContainer.style.display = "none";
            progressBar.style.width = "0%";

        });

        // ===============================
        // DRAG & DROP
        // ===============================

        const dropArea =
            document.getElementById("dropArea");


        dropArea.addEventListener("dragover", function (event) {

            event.preventDefault();

            dropArea.style.borderColor =
                "#2563eb";

        });


        dropArea.addEventListener("dragleave", function () {

            dropArea.style.borderColor =
                "#ccc";

        });


        dropArea.addEventListener("drop", function (event) {

            event.preventDefault();

            dropArea.style.borderColor =
                "#ccc";

            const files =
                event.dataTransfer.files;

                if (files.length > 0) {

                    fileInput.files = files;
                
                    fileName.textContent =
                        "Selected file: " +
                        files[0].name;
                
                    fileSize.textContent =
                        "Size: " +
                        (files[0].size / 1024).toFixed(2) +
                        " KB";
                
                }

        }); 
        // ===============================
        // WORD & CHARACTER COUNTER
        // ===============================

        function updateTextStats() {

            const text = documentText.value;

            const characters = text.replace(/\s/g, "").length;

            const words = text.trim() === ""
                ? 0
                : text.trim().split(/\s+/).length;

            wordCount.textContent = words;
            charCount.textContent = characters;

        }

        documentText.addEventListener("input", updateTextStats);


        // ===============================
        // COPY TEXT
        // ===============================
        
        copyButton.addEventListener("click", function () {
            const text = documentText.value;

            if (text.trim() === "") {
                alert("There is no text to copy.");
                return;
            }

            navigator.clipboard.writeText(text)
                .then(function () {
                    copyButton.textContent = "✅ Copied!";
                    
                    setTimeout(function () {
                        copyButton.textContent = "Copy Text";
                    }, 2000);
                })
                .catch(function () {
                    alert("Unable to copy the text.");
                });

        });
        // ===============================
// FIND & REPLACE
// ===============================

const findInput = document.getElementById("findInput");
const replaceInput = document.getElementById("replaceInput");
const findButton = document.getElementById("findButton");
const replaceButton = document.getElementById("replaceButton");
const replaceAllButton = document.getElementById("replaceAllButton");


// FIND
findButton.addEventListener("click", function () {

    const findText = findInput.value.trim();

    if (findText === "") {
        alert("Please enter text to find.");
        return;
    }

    const text = documentText.value;

    if (text.toLowerCase().includes(findText.toLowerCase())) {

        statusMessage.textContent = "🔎 Text found!";

    } else {

        statusMessage.textContent = "❌ Text not found.";

    }

});


// REPLACE FIRST
replaceButton.addEventListener("click", function () {

    const findText = findInput.value;
    const replaceText = replaceInput.value;

    if (findText === "") {
        alert("Please enter text to find.");
        return;
    }

    const text = documentText.value;
    const index = text.indexOf(findText);

    if (index === -1) {

        alert("Text not found.");
        return;

    }

    documentText.value =
        text.slice(0, index) +
        replaceText +
        text.slice(index + findText.length);

    updateTextStats();

    statusMessage.textContent = "✅ Text replaced!";

});


// REPLACE ALL
replaceAllButton.addEventListener("click", function () {

    const findText = findInput.value;
    const replaceText = replaceInput.value;

    if (findText === "") {
        alert("Please enter text to find.");
        return;
    }

    const escapedText =
        findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(escapedText, "gi");

    const oldText = documentText.value;

    const newText =
        oldText.replace(regex, replaceText);

    if (newText === oldText) {

        alert("Text not found.");
        return;

    }

    documentText.value = newText;

    updateTextStats();

    statusMessage.textContent =
        "✅ All occurrences replaced!";

});

downloadWordButton.addEventListener("click", async function () {

    const text = documentText.value;

    if (text.trim() === "") {
        alert("There is no text to download.");
        return;
    }

    try {

        const paragraphs = text.split(/\r?\n/).map(function (line) {

            return new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: line
                    })
                ]
            });

        });

        const wordDoc = new docx.Document({
            sections: [
                {
                    children: paragraphs
                }
            ]
        });

        const blob = await docx.Packer.toBlob(wordDoc);

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "converted-document.docx";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        statusMessage.textContent =
            "✅ Word document downloaded!";

    } catch (error) {

        console.error("Word download error:", error);

        alert("Unable to create the Word document.");

    }

});
// Download as PDF
document.getElementById("downloadPdfButton").addEventListener("click", function () {
    const text = document.getElementById("documentText").value;

    if (!text.trim()) {
        alert("Please convert or enter some text first.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    const lines = pdf.splitTextToSize(text, 180);

    let y = 20;

    lines.forEach(function (line) {
        if (y > 280) {
            pdf.addPage();
            y = 20;
        }

        pdf.text(line, 15, y);
        y += 7;
    });

    pdf.save("converted-document.pdf");
});