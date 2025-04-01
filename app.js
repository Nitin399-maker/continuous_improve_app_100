import { asyncLLM } from "https://cdn.jsdelivr.net/npm/asyncllm@2";

const apiUrl =
  "https://llmfoundry.straive.com/gemini/v1beta/openai/chat/completions";

const requestCode = async (prompt) => {
  const body = {
    model: "gemini-2.0-flash",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  };

  let fullContent = "";
  let currentChunk = "";
  let tempIframe = document.createElement("iframe"); // Always create a temp iframe

  // Append tempIframe to body for live preview
  document.body.appendChild(tempIframe);

  try {
    for await (const data of asyncLLM(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    })) {
      if (data.error) {
        console.error("API Error:", data.error);
        throw new Error(data.error.message || "LLM API Error");
      }

      if (data.content) {
        currentChunk += data.content;
        if (currentChunk.includes("</html>") || currentChunk.includes("</body>") || currentChunk.includes("</div>")) {
          fullContent = currentChunk;
          currentChunk = "";

          fullContent = fullContent.replace(/```html/g, "").replace(/```/g, "");

          // Update tempIframe with live preview
          const blob = new Blob([fullContent], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          tempIframe.src = url;
          tempIframe.onload = () => URL.revokeObjectURL(url);
        }
      }
    }

    // Ensure the last part is also added
    if (currentChunk) {
      fullContent += currentChunk;
      fullContent = fullContent.replace(/```html/g, "").replace(/```/g, "");

      // Final update to tempIframe
      const blob = new Blob([fullContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      tempIframe.src = url;
      tempIframe.onload = () => URL.revokeObjectURL(url);
    }

    // Remove tempIframe once final HTML is ready
    tempIframe.remove();

    return fullContent;
  } catch (error) {
    console.error("Error during LLM request:", error);
    tempIframe.remove();
    return "";
  }
};
  

let previousCode = "";
let iterationCount = 0;

const createNewPreviewContainer = (code, explanation) => {
  const container = document.createElement('div');
  container.className = 'preview-container';
  
  const iterationLabel = document.createElement('h3');
  iterationLabel.textContent = iterationCount === 0 ? 'Initial Version' : `Improvement #${iterationCount}`;
  container.appendChild(iterationLabel);

  if (explanation) {
    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'explanation';
    explanationDiv.innerHTML = `<h4>Changes Made:</h4>${explanation}`;
    container.appendChild(explanationDiv);
  }

  const iframe = document.createElement('iframe');
  const blob = new Blob([code], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  iframe.src = url;
  iframe.onload = () => URL.revokeObjectURL(url);
  
  container.appendChild(iframe);
  document.getElementById('previewsContainer').appendChild(container);
};

const updatePreview = (code) => {
  // Extract explanation if present
  const parts = code.split('### Explanation of Improvements and Changes:');
  const htmlCode = parts[0].trim();
  const explanation = parts[1] ? parts[1].trim() : '';

  createNewPreviewContainer(htmlCode, explanation);
  previousCode = htmlCode;
  
  document.getElementById("improvement").style.display = "block";
  document.getElementById("apply").style.display = "block";
};

const setLoading = (isLoading, buttonId) => {
  const button = document.getElementById(buttonId);
  button.textContent = isLoading
    ? "Loading..."
    : buttonId === "submit"
      ? "Submit"
      : "Improve";
  button.disabled = isLoading;
};

document.getElementById("submit").onclick = async () => {
  const desc = document.getElementById("input").value.trim();
  if (!desc) return alert("Enter app details.");

  setLoading(true, "submit");
  try {
    const code = await requestCode(
      `Generate a complete frontend application that is self-contained HTML document with all styles and scripts included inline. Do not separate the code into multiple files (e.g., no external CSS or JavaScript files). The entire webpage should be within a single HTML file, using <style> for CSS and <script> for JavaScript inside the <head> or <body> as appropriate. Ensure the document is functional, properly structured, and formatted for direct rendering in a browser.and the explanation should not be more than one line.Provide the full code as a single self-contained HTML document.Description:\n\n${desc}`,
    );
    iterationCount = 0;
    document.getElementById('previewsContainer').innerHTML = ''; // Clear previous versions
    updatePreview(code);
  } finally {
    setLoading(false, "submit");
  }
};

document.getElementById("apply").onclick = async () => {
  const improv = document.getElementById("improvement").value.trim();
  if (!improv) return alert("Enter improvement details.");

  if (!previousCode) {
    return alert("No previous code found. Generate an app first.");
  }

  setLoading(true, "apply");
  try {
    const code = await requestCode(`Here is the existing frontend code:

${previousCode}
  
The user has requested the following improvements:
  
${improv}
  
Provide the fully updated frontend application code as a complete, self-contained HTML document. The generated code must include all styles and scripts inline, ensuring the entire implementation is contained within a single HTML file.  
**Do not use placeholders** like \`/* ...existing styles... */\` or \`<!-- existing code -->\`. The generated code must be **complete** with all necessary elements included.  
Do not summarize, reference, or output only the changes—generate the **entire updated version from scratch** based on the requested improvements.  
Ensure the document is **fully functional**, properly structured, and formatted for direct rendering in a browser. All CSS should be placed inside a <style> tag, and all JavaScript should be included within a <script> tag in the same file.  
Return only the updated HTML code. The output should be a **fully operational webpage** with all requested updates applied.
Each time an improvement is requested, enhance the application further, ensuring continuous upgrades with every iteration. Do not summarize or reference changes—always provide the entire, updated HTML file from scratch.
also return me the explanation of changes in english(human language not in code language) in well formated text that what are the improvements it made from last time.at each time give me the improvments points below "### Explanation of Improvements and Changes:" this line 
Rewrite the following explanation in a simple, direct, and user-friendly manner. Focus on describing the behavior or functionality rather than technical details. Avoid mentioning variables, functions, or code implementations. Use short sentences and clear wording to make the explanation easy to understand for a non-technical audience.`);
    iterationCount++;
    updatePreview(code);
  } finally {
    setLoading(false, "apply");
  }
};

// Initialize container on load
document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('div');
  container.id = 'previewsContainer';
  document.body.appendChild(container);
});







