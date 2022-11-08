const DATA_URL = {
  SOURCE: "https://www.cnbc.com/us-market-movers/",
  STORE: "https://tinyurl.com/mtpzcucb",
};

let state = {
  tabInstance: { source: null, store: null },
  currentStep: null,
  data: null,
};

const EVENTS = {
  START_SCRAPING: "START_SCRAPING",
  COLLECT_DATA_START: "COLLECT_DATA_START",
  COLLECT_DATA_COMPLETE: "COLLECT_DATA_COMPLETE",
  STORE_DATA_START: "STORE_DATA_START",
  STORE_DATA_COMPLETE: "STORE_DATA_COMPLETE",
};

chrome.runtime.onMessage.addListener((message) => {
  const { data, error, type } = message;

  if (!state.currentStep && type == EVENTS.START_SCRAPING) {
    state.currentStep = EVENTS.COLLECT_DATA_START;
    addListener();
    openDataSource();
  } else if (type == EVENTS.COLLECT_DATA_COMPLETE) {
    chrome.tabs.remove(state.tabInstance.source);
    state.currentStep = EVENTS.STORE_DATA_START;
    if (error) {
      console.log(error);
      reset();
    } else {
      state.data = data;
      openDataStore();
    }
  } else if (type == EVENTS.STORE_DATA_COMPLETE) {
    chrome.tabs.remove(state.tabInstance.store);
    if (error) {
      console.log(error);
    } else {
      console.log("Done");
    }
    reset();
  }
});

function reset() {
  state = {
    tabInstance: { source: null, store: null },
    currentStep: null,
    data: null,
  };
}

function openDataSource() {
  chrome.tabs.create({ url: DATA_URL.SOURCE }, (tab) => {
    state.tabInstance.source = tab.id;
  });
}

function openDataStore() {
  chrome.tabs.create({ url: DATA_URL.STORE }, (tab) => {
    state.tabInstance.store = tab.id;
  });
}

function collectData({ EVENTS }) {
  const SELECTORS = {
    LINK: ".MarketMoversMenu-marketOption:nth-child(2)",
    DATA_ROW:
      ".MarketMovers-marketTopContainer .MarketTop-fullWidthContainer:nth-child(1) table.MarketTop-topTable tr:nth-child(2)",
  };

  function getRowData() {
    return new Promise((resolve, reject) => {
      const selectTab = () => {
        const link = document.querySelector(
          SELECTORS.LINK
        ) as HTMLButtonElement;
        if (!link) {
          reject({ message: "Link not found" });
        }
        link.click();
      };

      const maxWaitTime = 10000; // 10 sec
      const startTime = Date.now();

      const getData = () => {
        const deltaTime = Date.now() - startTime;
        if (deltaTime > maxWaitTime) {
          reject({ message: "Page Load Timeout" });
          return;
        }

        setTimeout(() => {
          const row = document.querySelector(SELECTORS.DATA_ROW);

          if (!row) {
            // page loading or error
            getData();
            return;
          }

          const data = [
            row.childNodes[1].textContent,
            row.childNodes[3].textContent,
            Date.now(),
          ];

          resolve(data);
        }, 100);
      };

      // Click on NASDAQ tab item
      selectTab();

      // Wait for page to load and extract data from 2nd row
      getData();
    });
  }

  getRowData()
    .then((data) => {
      chrome.runtime.sendMessage({ type: EVENTS.COLLECT_DATA_COMPLETE, data });
    })
    .catch((error) => {
      // TODO: Handle Error
      chrome.runtime.sendMessage({ type: EVENTS.COLLECT_DATA_COMPLETE, error });
    });
}

function saveData({ data, EVENTS }) {
  const SELECTORS = {
    FIELDS: "#formRedirectURL #formBodyDiv input",
    SUBMIT: "#formRedirectURL .fmSmtButton",
  };

  const fields = document.querySelectorAll(
    SELECTORS.FIELDS
  ) as NodeListOf<HTMLInputElement>;
  fields.forEach((field, index) => {
    field.value = data[index];
  });

  const submit = document.querySelector(SELECTORS.SUBMIT) as HTMLButtonElement;
  submit.click();

  setTimeout(() => {
    chrome.runtime.sendMessage({ type: EVENTS.STORE_DATA_COMPLETE });
  }, 1000);
}

// chrome.tabs.executeScript

function onTabUpdate(tabId, changeInfo, tab) {
  if (
    state.currentStep == EVENTS.COLLECT_DATA_START &&
    state.tabInstance.source == tabId &&
    changeInfo.status == "complete"
  ) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: collectData,
      args: [{ EVENTS }],
    });
  } else if (
    state.currentStep == EVENTS.STORE_DATA_START &&
    state.tabInstance.store == tabId &&
    changeInfo.status == "complete"
  ) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: saveData,
      args: [{ data: state.data, EVENTS }],
    });
  }
}

function addListener() {
  chrome.tabs.onUpdated.addListener(onTabUpdate);
}

function removeListener() {
  chrome.tabs.onUpdated.removeListener(onTabUpdate);
}
