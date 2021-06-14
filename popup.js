const fetchPub = document.getElementById('fetch')
const table = document.getElementById('content')

const getPubs = () => {
  chrome.runtime.sendMessage('fetchPubs', ({ publications }) => {
    for (const pub of publications) {
      const row = table.insertRow()
      const pubDate = row.insertCell()
      const pubDateText = document.createTextNode(
        new Date(pub.date).toLocaleString()
      )
      pubDate.appendChild(pubDateText)

      const pubLink = document.createElement('a')
      pubLink.href = pub.url
      pubLink.target = '_blank'
      const title = row.insertCell()
      const titleText = document.createTextNode(pub.title)
      pubLink.appendChild(titleText)
      title.appendChild(pubLink)
    }
  })
}

window.onload = () => {
  getPubs()
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const tabId = tabs[0].id
      chrome.action.setBadgeText({ text: '', tabId })
    }
  })
}
