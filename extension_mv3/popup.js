const storageKey = "apiBase";
const defaultBase = "http://127.0.0.1:8000";

function getApiBase() {
  return new Promise(res => {
    chrome.storage.sync.get([storageKey], v => res((v && v[storageKey]) || defaultBase));
  });
}
async function shorten(url) {
  const base = await getApiBase();
  const resp = await fetch(`${base}/api/links`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ target: url, require_password: false })
  });
  if (!resp.ok) throw new Error(`API ${resp.status}`);
  return resp.json(); // {id, target}
}
function openPreview(id) {
  getApiBase().then(base => {
    chrome.tabs.create({ url: `${base}/p/${id}` });
  });
}
useTab.onclick = async () => {
  const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
  if (tab && tab.url) url.value = tab.url;
};
shorten.onclick = async () => {
  let u = (url.value || "").trim();
  if (!/^https?:\/\//i.test(u)) { alert("Enter a valid http(s) URL"); return; }
  shorten.disabled = true;
  try {
    const data = await shorten(u);
    openPreview(data.id);
  } catch (e) {
    alert("Failed: " + e.message);
  } finally {
    shorten.disabled = false;
  }
};
