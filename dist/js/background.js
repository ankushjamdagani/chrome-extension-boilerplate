/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/app/background.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/app/background.ts":
/*!*******************************!*\
  !*** ./src/app/background.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
    }
    else if (type == EVENTS.COLLECT_DATA_COMPLETE) {
        chrome.tabs.remove(state.tabInstance.source);
        state.currentStep = EVENTS.STORE_DATA_START;
        if (error) {
            console.log(error);
            reset();
        }
        else {
            state.data = data;
            openDataStore();
        }
    }
    else if (type == EVENTS.STORE_DATA_COMPLETE) {
        chrome.tabs.remove(state.tabInstance.store);
        if (error) {
            console.log(error);
        }
        else {
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
        DATA_ROW: ".MarketMovers-marketTopContainer .MarketTop-fullWidthContainer:nth-child(1) table.MarketTop-topTable tr:nth-child(2)",
    };
    function getRowData() {
        return new Promise((resolve, reject) => {
            const selectTab = () => {
                const link = document.querySelector(SELECTORS.LINK);
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
    const fields = document.querySelectorAll(SELECTORS.FIELDS);
    fields.forEach((field, index) => {
        field.value = data[index];
    });
    const submit = document.querySelector(SELECTORS.SUBMIT);
    submit.click();
    setTimeout(() => {
        chrome.runtime.sendMessage({ type: EVENTS.STORE_DATA_COMPLETE });
    }, 1000);
}
// chrome.tabs.executeScript
function onTabUpdate(tabId, changeInfo, tab) {
    if (state.currentStep == EVENTS.COLLECT_DATA_START &&
        state.tabInstance.source == tabId &&
        changeInfo.status == "complete") {
        chrome.scripting.executeScript({
            target: { tabId },
            func: collectData,
            args: [{ EVENTS }],
        });
    }
    else if (state.currentStep == EVENTS.STORE_DATA_START &&
        state.tabInstance.store == tabId &&
        changeInfo.status == "complete") {
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


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FwcC9iYWNrZ3JvdW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JBQWtCO1FBQzFFO1FBQ0EsaURBQWlELGNBQWM7UUFDL0Q7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBLHlDQUF5QyxpQ0FBaUM7UUFDMUUsZ0hBQWdILG1CQUFtQixFQUFFO1FBQ3JJO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMkJBQTJCLDBCQUEwQixFQUFFO1FBQ3ZELGlDQUFpQyxlQUFlO1FBQ2hEO1FBQ0E7UUFDQTs7UUFFQTtRQUNBLHNEQUFzRCwrREFBK0Q7O1FBRXJIO1FBQ0E7OztRQUdBO1FBQ0E7Ozs7Ozs7Ozs7OztBQ2xGQSxNQUFNLFFBQVEsR0FBRztJQUNmLE1BQU0sRUFBRSx3Q0FBd0M7SUFDaEQsS0FBSyxFQUFFLDhCQUE4QjtDQUN0QyxDQUFDO0FBRUYsSUFBSSxLQUFLLEdBQUc7SUFDVixXQUFXLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7SUFDMUMsV0FBVyxFQUFFLElBQUk7SUFDakIsSUFBSSxFQUFFLElBQUk7Q0FDWCxDQUFDO0FBRUYsTUFBTSxNQUFNLEdBQUc7SUFDYixjQUFjLEVBQUUsZ0JBQWdCO0lBQ2hDLGtCQUFrQixFQUFFLG9CQUFvQjtJQUN4QyxxQkFBcUIsRUFBRSx1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U0FBUyxXQUFXLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxHQUFHO0lBQ3pDLElBQ0UsS0FBSyxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUMsa0JBQWtCO1FBQzlDLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxJQUFJLEtBQUs7UUFDakMsVUFBVSxDQUFDLE1BQU0sSUFBSSxVQUFVLEVBQy9CO1FBQ0EsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUM7WUFDN0IsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFO1lBQ2pCLElBQUksRUFBRSxXQUFXO1lBQ2pCLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUM7U0FDbkIsQ0FBQyxDQUFDO0tBQ0o7U0FBTSxJQUNMLEtBQUssQ0FBQyxXQUFXLElBQUksTUFBTSxDQUFDLGdCQUFnQjtRQUM1QyxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssSUFBSSxLQUFLO1FBQ2hDLFVBQVUsQ0FBQyxNQUFNLElBQUksVUFBVSxFQUMvQjtRQUNBLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDO1lBQzdCLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRTtZQUNqQixJQUFJLEVBQUUsUUFBUTtZQUNkLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7U0FDckMsQ0FBQyxDQUFDO0tBQ0o7QUFDSCxDQUFDO0FBRUQsU0FBUyxXQUFXO0lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBRUQsU0FBUyxjQUFjO0lBQ3JCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNwRCxDQUFDIiwiZmlsZSI6ImJhY2tncm91bmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3NyYy9hcHAvYmFja2dyb3VuZC50c1wiKTtcbiIsImNvbnN0IERBVEFfVVJMID0ge1xuICBTT1VSQ0U6IFwiaHR0cHM6Ly93d3cuY25iYy5jb20vdXMtbWFya2V0LW1vdmVycy9cIixcbiAgU1RPUkU6IFwiaHR0cHM6Ly90aW55dXJsLmNvbS9tdHB6Y3VjYlwiLFxufTtcblxubGV0IHN0YXRlID0ge1xuICB0YWJJbnN0YW5jZTogeyBzb3VyY2U6IG51bGwsIHN0b3JlOiBudWxsIH0sXG4gIGN1cnJlbnRTdGVwOiBudWxsLFxuICBkYXRhOiBudWxsLFxufTtcblxuY29uc3QgRVZFTlRTID0ge1xuICBTVEFSVF9TQ1JBUElORzogXCJTVEFSVF9TQ1JBUElOR1wiLFxuICBDT0xMRUNUX0RBVEFfU1RBUlQ6IFwiQ09MTEVDVF9EQVRBX1NUQVJUXCIsXG4gIENPTExFQ1RfREFUQV9DT01QTEVURTogXCJDT0xMRUNUX0RBVEFfQ09NUExFVEVcIixcbiAgU1RPUkVfREFUQV9TVEFSVDogXCJTVE9SRV9EQVRBX1NUQVJUXCIsXG4gIFNUT1JFX0RBVEFfQ09NUExFVEU6IFwiU1RPUkVfREFUQV9DT01QTEVURVwiLFxufTtcblxuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlKSA9PiB7XG4gIGNvbnN0IHsgZGF0YSwgZXJyb3IsIHR5cGUgfSA9IG1lc3NhZ2U7XG5cbiAgaWYgKCFzdGF0ZS5jdXJyZW50U3RlcCAmJiB0eXBlID09IEVWRU5UUy5TVEFSVF9TQ1JBUElORykge1xuICAgIHN0YXRlLmN1cnJlbnRTdGVwID0gRVZFTlRTLkNPTExFQ1RfREFUQV9TVEFSVDtcbiAgICBhZGRMaXN0ZW5lcigpO1xuICAgIG9wZW5EYXRhU291cmNlKCk7XG4gIH0gZWxzZSBpZiAodHlwZSA9PSBFVkVOVFMuQ09MTEVDVF9EQVRBX0NPTVBMRVRFKSB7XG4gICAgY2hyb21lLnRhYnMucmVtb3ZlKHN0YXRlLnRhYkluc3RhbmNlLnNvdXJjZSk7XG4gICAgc3RhdGUuY3VycmVudFN0ZXAgPSBFVkVOVFMuU1RPUkVfREFUQV9TVEFSVDtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgIHJlc2V0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlLmRhdGEgPSBkYXRhO1xuICAgICAgb3BlbkRhdGFTdG9yZSgpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlID09IEVWRU5UUy5TVE9SRV9EQVRBX0NPTVBMRVRFKSB7XG4gICAgY2hyb21lLnRhYnMucmVtb3ZlKHN0YXRlLnRhYkluc3RhbmNlLnN0b3JlKTtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coXCJEb25lXCIpO1xuICAgIH1cbiAgICByZXNldCgpO1xuICB9XG59KTtcblxuZnVuY3Rpb24gcmVzZXQoKSB7XG4gIHN0YXRlID0ge1xuICAgIHRhYkluc3RhbmNlOiB7IHNvdXJjZTogbnVsbCwgc3RvcmU6IG51bGwgfSxcbiAgICBjdXJyZW50U3RlcDogbnVsbCxcbiAgICBkYXRhOiBudWxsLFxuICB9O1xufVxuXG5mdW5jdGlvbiBvcGVuRGF0YVNvdXJjZSgpIHtcbiAgY2hyb21lLnRhYnMuY3JlYXRlKHsgdXJsOiBEQVRBX1VSTC5TT1VSQ0UgfSwgKHRhYikgPT4ge1xuICAgIHN0YXRlLnRhYkluc3RhbmNlLnNvdXJjZSA9IHRhYi5pZDtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG9wZW5EYXRhU3RvcmUoKSB7XG4gIGNocm9tZS50YWJzLmNyZWF0ZSh7IHVybDogREFUQV9VUkwuU1RPUkUgfSwgKHRhYikgPT4ge1xuICAgIHN0YXRlLnRhYkluc3RhbmNlLnN0b3JlID0gdGFiLmlkO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY29sbGVjdERhdGEoeyBFVkVOVFMgfSkge1xuICBjb25zdCBTRUxFQ1RPUlMgPSB7XG4gICAgTElOSzogXCIuTWFya2V0TW92ZXJzTWVudS1tYXJrZXRPcHRpb246bnRoLWNoaWxkKDIpXCIsXG4gICAgREFUQV9ST1c6XG4gICAgICBcIi5NYXJrZXRNb3ZlcnMtbWFya2V0VG9wQ29udGFpbmVyIC5NYXJrZXRUb3AtZnVsbFdpZHRoQ29udGFpbmVyOm50aC1jaGlsZCgxKSB0YWJsZS5NYXJrZXRUb3AtdG9wVGFibGUgdHI6bnRoLWNoaWxkKDIpXCIsXG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0Um93RGF0YSgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3Qgc2VsZWN0VGFiID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBsaW5rID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICBTRUxFQ1RPUlMuTElOS1xuICAgICAgICApIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgICAgICBpZiAoIWxpbmspIHtcbiAgICAgICAgICByZWplY3QoeyBtZXNzYWdlOiBcIkxpbmsgbm90IGZvdW5kXCIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGluay5jbGljaygpO1xuICAgICAgfTtcblxuICAgICAgY29uc3QgbWF4V2FpdFRpbWUgPSAxMDAwMDsgLy8gMTAgc2VjXG4gICAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgICBjb25zdCBnZXREYXRhID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBkZWx0YVRpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgICBpZiAoZGVsdGFUaW1lID4gbWF4V2FpdFRpbWUpIHtcbiAgICAgICAgICByZWplY3QoeyBtZXNzYWdlOiBcIlBhZ2UgTG9hZCBUaW1lb3V0XCIgfSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihTRUxFQ1RPUlMuREFUQV9ST1cpO1xuXG4gICAgICAgICAgaWYgKCFyb3cpIHtcbiAgICAgICAgICAgIC8vIHBhZ2UgbG9hZGluZyBvciBlcnJvclxuICAgICAgICAgICAgZ2V0RGF0YSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGRhdGEgPSBbXG4gICAgICAgICAgICByb3cuY2hpbGROb2Rlc1sxXS50ZXh0Q29udGVudCxcbiAgICAgICAgICAgIHJvdy5jaGlsZE5vZGVzWzNdLnRleHRDb250ZW50LFxuICAgICAgICAgICAgRGF0ZS5ub3coKSxcbiAgICAgICAgICBdO1xuXG4gICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgfSwgMTAwKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIENsaWNrIG9uIE5BU0RBUSB0YWIgaXRlbVxuICAgICAgc2VsZWN0VGFiKCk7XG5cbiAgICAgIC8vIFdhaXQgZm9yIHBhZ2UgdG8gbG9hZCBhbmQgZXh0cmFjdCBkYXRhIGZyb20gMm5kIHJvd1xuICAgICAgZ2V0RGF0YSgpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0Um93RGF0YSgpXG4gICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgdHlwZTogRVZFTlRTLkNPTExFQ1RfREFUQV9DT01QTEVURSwgZGF0YSB9KTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIC8vIFRPRE86IEhhbmRsZSBFcnJvclxuICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyB0eXBlOiBFVkVOVFMuQ09MTEVDVF9EQVRBX0NPTVBMRVRFLCBlcnJvciB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2F2ZURhdGEoeyBkYXRhLCBFVkVOVFMgfSkge1xuICBjb25zdCBTRUxFQ1RPUlMgPSB7XG4gICAgRklFTERTOiBcIiNmb3JtUmVkaXJlY3RVUkwgI2Zvcm1Cb2R5RGl2IGlucHV0XCIsXG4gICAgU1VCTUlUOiBcIiNmb3JtUmVkaXJlY3RVUkwgLmZtU210QnV0dG9uXCIsXG4gIH07XG5cbiAgY29uc3QgZmllbGRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcbiAgICBTRUxFQ1RPUlMuRklFTERTXG4gICkgYXMgTm9kZUxpc3RPZjxIVE1MSW5wdXRFbGVtZW50PjtcbiAgZmllbGRzLmZvckVhY2goKGZpZWxkLCBpbmRleCkgPT4ge1xuICAgIGZpZWxkLnZhbHVlID0gZGF0YVtpbmRleF07XG4gIH0pO1xuXG4gIGNvbnN0IHN1Ym1pdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoU0VMRUNUT1JTLlNVQk1JVCkgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHN1Ym1pdC5jbGljaygpO1xuXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgdHlwZTogRVZFTlRTLlNUT1JFX0RBVEFfQ09NUExFVEUgfSk7XG4gIH0sIDEwMDApO1xufVxuXG4vLyBjaHJvbWUudGFicy5leGVjdXRlU2NyaXB0XG5cbmZ1bmN0aW9uIG9uVGFiVXBkYXRlKHRhYklkLCBjaGFuZ2VJbmZvLCB0YWIpIHtcbiAgaWYgKFxuICAgIHN0YXRlLmN1cnJlbnRTdGVwID09IEVWRU5UUy5DT0xMRUNUX0RBVEFfU1RBUlQgJiZcbiAgICBzdGF0ZS50YWJJbnN0YW5jZS5zb3VyY2UgPT0gdGFiSWQgJiZcbiAgICBjaGFuZ2VJbmZvLnN0YXR1cyA9PSBcImNvbXBsZXRlXCJcbiAgKSB7XG4gICAgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcbiAgICAgIHRhcmdldDogeyB0YWJJZCB9LFxuICAgICAgZnVuYzogY29sbGVjdERhdGEsXG4gICAgICBhcmdzOiBbeyBFVkVOVFMgfV0sXG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoXG4gICAgc3RhdGUuY3VycmVudFN0ZXAgPT0gRVZFTlRTLlNUT1JFX0RBVEFfU1RBUlQgJiZcbiAgICBzdGF0ZS50YWJJbnN0YW5jZS5zdG9yZSA9PSB0YWJJZCAmJlxuICAgIGNoYW5nZUluZm8uc3RhdHVzID09IFwiY29tcGxldGVcIlxuICApIHtcbiAgICBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuICAgICAgdGFyZ2V0OiB7IHRhYklkIH0sXG4gICAgICBmdW5jOiBzYXZlRGF0YSxcbiAgICAgIGFyZ3M6IFt7IGRhdGE6IHN0YXRlLmRhdGEsIEVWRU5UUyB9XSxcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRMaXN0ZW5lcigpIHtcbiAgY2hyb21lLnRhYnMub25VcGRhdGVkLmFkZExpc3RlbmVyKG9uVGFiVXBkYXRlKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoKSB7XG4gIGNocm9tZS50YWJzLm9uVXBkYXRlZC5yZW1vdmVMaXN0ZW5lcihvblRhYlVwZGF0ZSk7XG59XG4iXSwic291cmNlUm9vdCI6IiJ9