chrome.runtime.onInstalled.addListener(async () => {
  const publications = await fetchPubs()
  chrome.storage.sync.set({ publications })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message == 'fetchPubs') {
    chrome.storage.sync.get(['publications'], (results) => {
      sendResponse(results)
    })
    return true
  }
})

chrome.alarms.create('syncPubs', {
  periodInMinutes: 1,
  when: 1000,
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncPubs') {
    console.log('syncpubs')
    syncPubs()
  }
})

const getCurrentTab = async () => {
  let queryOptions = { active: true, currentWindow: true }
  let [tab] = await chrome.tabs.query(queryOptions)
  return tab
}

const fetchPubs = async () => {
  let response, data
  response = await fetch(
    'https://www.gov.il/he/api/PublicationApi/Index?limit=10&OfficeId=4bcc13f5-fed6-4b8c-b8ee-7bf4a6bc81c8&publicationType=f2d28b83-ce5f-4ce3-a164-3fd0383b405a&skip=0',
    {
      body: null,
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
    }
  )

  data = await response.json()

  return data.results.map((r) => {
    return {
      id: r.ItemUniqueId,
      url: `https://www.gov.il/he/${r.BaseUrl}${r.UrlName}`,
      date: r.DocPublishedDate,
      title: r.Title,
    }
  })
}

const syncPubs = async () => {
  const newPubs = await fetchPubs()
  chrome.storage.sync.get(['publications'], ({ publications }) => {
    const currentPubs = publications

    const updatePubs = [...currentPubs]
    let newMessages = 0
    for (const newPub of newPubs) {
      const findPub = updatePubs.find((p) => p.id === newPub.id)
      if (findPub) continue
      updatePubs.push(newPub)
      newMessages++
    }

    if (newMessages > 0) {
      const sorted = updatePubs.sort((a, b) => a.date - b.date)
      chrome.storage.sync.set({ publications: sorted })

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          const tabId = tabs[0].id
          chrome.action.setBadgeText({ text: newMessages, tabId })
        }
      })
    }
  })
}
