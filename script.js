var s = document.createElement('script');
var p = document.createElement('script');
var d = document.createElement('script');
var style = document.createElement('link');

style.rel = "stylesheet";
style.href = chrome.extension.getURL('style.css');

d.src = chrome.extension.getURL('double_scroll.js');
s.src = chrome.extension.getURL('octopus.js');
p.innerHTML = 'var updatedProjectsIndex = "' + chrome.extension.getURL('projects_index.html') + '";';

document.head.appendChild(style);
document.head.appendChild(d);

document.body.appendChild(p);
document.body.appendChild(s);