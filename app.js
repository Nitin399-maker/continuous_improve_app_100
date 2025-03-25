let token;

window.onload = async function () {
  try {
    const response = await fetch("https://llmfoundry.straive.com/token", {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`); // Handle non-200 responses
    }

    const data = await response.json();

    if (data && data.token) {
      token = data.token;
      console.log("Token retrieved:", token); // Log the token for verification
      // You can now use the token for subsequent requests or store it.
    } else {
      token = null;
      console.warn("Token not found in response:", data); // Log the response for debugging
    }
  } catch (error) {
    token = null;
    console.error("Error fetching token:", error); // Log the error for debugging
  }
};

const apiUrl =
  "https://llmfoundry.straive.com/gemini/v1beta/openai/chat/completions";




const requestCode = async (prompt) => {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}:my-test-project`,
    },
    credentials: "include",
    body: JSON.stringify({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  return (
    (await res.json()).choices[0].message.content.match(
      /<!DOCTYPE html>[\s\S]*<\/html>/,
    )?.[0] || ""
  );
};


let previousCode = ""; // Store the last generated code

const updatePreview = (code) => {
  console.log(code);

  const iframe = document.getElementById("preview");

  // Store the previous code before updating
  previousCode = code; 

  // Reset the iframe to force a clean reload
  iframe.srcdoc = ""; 
  iframe.src = "about:blank";  

  setTimeout(() => {
    iframe.srcdoc = code;
  }, 10);

  console.log(iframe);

  iframe.title = 'Live Preview';
  iframe.sandbox = 'allow-scripts allow-modals allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation allow-downloads';

  document.getElementById("improvement").style.display = "block";
  document.getElementById("apply").style.display = "block";
};

document.getElementById("submit").onclick = async () => {
  const desc = document.getElementById("input").value.trim();
  if (!desc) return alert("Enter app details.");

  const code = await requestCode(
`Generate a complete frontend application that is self-contained HTML document with all styles and scripts included inline. Do not separate the code into multiple files (e.g., no external CSS or JavaScript files). The entire webpage should be within a single HTML file, using <style> for CSS and <script> for JavaScript inside the <head> or <body> as appropriate. Ensure the document is functional, properly structured, and formatted for direct rendering in a browser.
Provide the full code as a single self-contained HTML document.Description:\n\n${desc}`
  );

  updatePreview(code);
};

document.getElementById("apply").onclick = async () => {
  const improv = document.getElementById("improvement").value.trim();
  if (!improv) return alert("Enter improvement details.");

  if (!previousCode) {
    return alert("No previous code found. Generate an app first.");
  }

  const code = await requestCode(`Here is the existing frontend code:

${previousCode}
  
The user has requested the following improvements:
  
${improv}
  
Provide the fully updated frontend application code as a complete, self-contained HTML document. The generated code must include all styles and scripts inline, ensuring the entire implementation is contained within a single HTML file.  
**Do not use placeholders** like \`/* ...existing styles... */\` or \`<!-- existing code -->\`. The generated code must be **complete** with all necessary elements included.  
Do not summarize, reference, or output only the changes—generate the **entire updated version from scratch** based on the requested improvements.  
Ensure the document is **fully functional**, properly structured, and formatted for direct rendering in a browser. All CSS should be placed inside a <style> tag, and all JavaScript should be included within a <script> tag in the same file.  
Return only the updated HTML code—do not include explanations or additional text. The output should be a **fully operational webpage** with all requested updates applied.
Each time an improvement is requested, enhance the application further, ensuring continuous upgrades with every iteration. Do not summarize or reference changes—always provide the entire, updated HTML file from scratch.`);

  updatePreview(code);
};

