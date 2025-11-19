const storageKey = "apiBase";
const defaultBase = "http://127.0.0.1:8000";

function getApiBase() {
  return new Promise(res => chrome.storage.sync.get([storageKey], v => res((v && v[storageKey]) || defaultBase)));
}
async function createLink(target) {
  const base = await getApiBase();
  const resp = await fetch(`${base}/api/links`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ target, require_password: false })
  });
  if (!resp.ok) throw new Error(`API ${resp.status}`);
  return resp.json(); // {id,target}
}
function openPreview(id) {
  getApiBase().then(base => chrome.tabs.create({ url: `${base}/p/${id}` }));
}

// context menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "peeklink-link",
    title: "Peek with PeekLink (shorten + preview)",
    contexts: ["link"]
  });
  chrome.contextMenus.create({
    id: "peeklink-page",
    title: "Peek this page with PeekLink",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    let target = info.linkUrl || (tab && tab.url);
    if (!target || !/^https?:\/\//i.test(target)) return;
    const data = await createLink(target);
    openPreview(data.id);
  } catch (e) {
    console.error(e);
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon48.png",
      title: "PeekLink",
      message: "Failed to contact API."
    });
  }
});
