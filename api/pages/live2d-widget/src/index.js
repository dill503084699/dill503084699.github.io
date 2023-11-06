{"title":"","type":"page","uid":"1cd19fc71517798e2fa5b7457d1fb06e","text":"import Model from \"./model.js\"; import showMessage from \"./message.js\"; import randomSelection from \"./utils.js\"; import tools from \"./tools...","date":"2023-11-05T11:16:24.484Z","updated":"2023-11-05T11:16:24.484Z","comments":true,"path":"api/pages/live2d-widget/src/index.js","covers":null,"excerpt":"","content":"import Model from \"./model.js\";\nimport showMessage from \"./message.js\";\nimport randomSelection from \"./utils.js\";\nimport tools from \"./tools.js\";\n\nfunction loadWidget(config) {\n    const model = new Model(config);\n    localStorage.removeItem(\"waifu-display\");\n    sessionStorage.removeItem(\"waifu-text\");\n    document.body.insertAdjacentHTML(\"beforeend\", `<div id=\"waifu\">\n            <div id=\"waifu-tips\"></div>\n            <canvas id=\"live2d\" width=\"800\" height=\"800\"></canvas>\n            <div id=\"waifu-tool\"></div>\n        </div>`);\n    // https://stackoverflow.com/questions/24148403/trigger-css-transition-on-appended-element\n    setTimeout(() => {\n        document.getElementById(\"waifu\").style.bottom = 0;\n    }, 0);\n\n    (function registerTools() {\n        tools[\"switch-model\"].callback = () => model.loadOtherModel();\n        tools[\"switch-texture\"].callback = () => model.loadRandModel();\n        if (!Array.isArray(config.tools)) {\n            config.tools = Object.keys(tools);\n        }\n        for (let tool of config.tools) {\n            if (tools[tool]) {\n                const { icon, callback } = tools[tool];\n                document.getElementById(\"waifu-tool\").insertAdjacentHTML(\"beforeend\", `<span id=\"waifu-tool-${tool}\">${icon}</span>`);\n                document.getElementById(`waifu-tool-${tool}`).addEventListener(\"click\", callback);\n            }\n        }\n    })();\n\n    function welcomeMessage(time) {\n        if (location.pathname === \"/\") { // 如果是主页\n            for (let { hour, text } of time) {\n                const now = new Date(),\n                    after = hour.split(\"-\")[0],\n                    before = hour.split(\"-\")[1] || after;\n                if (after <= now.getHours() && now.getHours() <= before) {\n                    return text;\n                }\n            }\n        }\n        const text = `欢迎阅读<span>「${document.title.split(\" - \")[0]}」</span>`;\n        let from;\n        if (document.referrer !== \"\") {\n            const referrer = new URL(document.referrer),\n                domain = referrer.hostname.split(\".\")[1];\n            const domains = {\n                \"baidu\": \"百度\",\n                \"so\": \"360搜索\",\n                \"google\": \"谷歌搜索\"\n            };\n            if (location.hostname === referrer.hostname) return text;\n\n            if (domain in domains) from = domains[domain];\n            else from = referrer.hostname;\n            return `Hello！来自 <span>${from}</span> 的朋友<br>${text}`;\n        }\n        return text;\n    }\n\n    function registerEventListener(result) {\n        // 检测用户活动状态，并在空闲时显示消息\n        let userAction = false,\n            userActionTimer,\n            messageArray = result.message.default,\n            lastHoverElement;\n        window.addEventListener(\"mousemove\", () => userAction = true);\n        window.addEventListener(\"keydown\", () => userAction = true);\n        setInterval(() => {\n            if (userAction) {\n                userAction = false;\n                clearInterval(userActionTimer);\n                userActionTimer = null;\n            } else if (!userActionTimer) {\n                userActionTimer = setInterval(() => {\n                    showMessage(messageArray, 6000, 9);\n                }, 20000);\n            }\n        }, 1000);\n        showMessage(welcomeMessage(result.time), 7000, 11);\n        window.addEventListener(\"mouseover\", event => {\n            for (let { selector, text } of result.mouseover) {\n                if (!event.target.closest(selector)) continue;\n                if (lastHoverElement === selector) return;\n                lastHoverElement = selector;\n                text = randomSelection(text);\n                text = text.replace(\"{text}\", event.target.innerText);\n                showMessage(text, 4000, 8);\n                return;\n            }\n        });\n        window.addEventListener(\"click\", event => {\n            for (let { selector, text } of result.click) {\n                if (!event.target.closest(selector)) continue;\n                text = randomSelection(text);\n                text = text.replace(\"{text}\", event.target.innerText);\n                showMessage(text, 4000, 8);\n                return;\n            }\n        });\n        result.seasons.forEach(({ date, text }) => {\n            const now = new Date(),\n                after = date.split(\"-\")[0],\n                before = date.split(\"-\")[1] || after;\n            if ((after.split(\"/\")[0] <= now.getMonth() + 1 && now.getMonth() + 1 <= before.split(\"/\")[0]) && (after.split(\"/\")[1] <= now.getDate() && now.getDate() <= before.split(\"/\")[1])) {\n                text = randomSelection(text);\n                text = text.replace(\"{year}\", now.getFullYear());\n                messageArray.push(text);\n            }\n        });\n\n        const devtools = () => { };\n        console.log(\"%c\", devtools);\n        devtools.toString = () => {\n            showMessage(result.message.console, 6000, 9);\n        };\n        window.addEventListener(\"copy\", () => {\n            showMessage(result.message.copy, 6000, 9);\n        });\n        window.addEventListener(\"visibilitychange\", () => {\n            if (!document.hidden) showMessage(result.message.visibilitychange, 6000, 9);\n        });\n    }\n\n    (function initModel() {\n        let modelId = localStorage.getItem(\"modelId\"),\n            modelTexturesId = localStorage.getItem(\"modelTexturesId\");\n        if (modelId === null) {\n            // 首次访问加载 指定模型 的 指定材质\n            modelId = 1; // 模型 ID\n            modelTexturesId = 53; // 材质 ID\n        }\n        model.loadModel(modelId, modelTexturesId);\n        fetch(config.waifuPath)\n            .then(response => response.json())\n            .then(registerEventListener);\n    })();\n}\n\nfunction initWidget(config, apiPath) {\n    if (typeof config === \"string\") {\n        config = {\n            waifuPath: config,\n            apiPath\n        };\n    }\n    document.body.insertAdjacentHTML(\"beforeend\", `<div id=\"waifu-toggle\">\n            <span>看板娘</span>\n        </div>`);\n    const toggle = document.getElementById(\"waifu-toggle\");\n    toggle.addEventListener(\"click\", () => {\n        toggle.classList.remove(\"waifu-toggle-active\");\n        if (toggle.getAttribute(\"first-time\")) {\n            loadWidget(config);\n            toggle.removeAttribute(\"first-time\");\n        } else {\n            localStorage.removeItem(\"waifu-display\");\n            document.getElementById(\"waifu\").style.display = \"\";\n            setTimeout(() => {\n                document.getElementById(\"waifu\").style.bottom = 0;\n            }, 0);\n        }\n    });\n    if (localStorage.getItem(\"waifu-display\") && Date.now() - localStorage.getItem(\"waifu-display\") <= 86400000) {\n        toggle.setAttribute(\"first-time\", true);\n        setTimeout(() => {\n            toggle.classList.add(\"waifu-toggle-active\");\n        }, 0);\n    } else {\n        loadWidget(config);\n    }\n}\n\nexport default initWidget;\n","count_time":{"symbolsCount":"6k","symbolsTime":"5 mins."},"toc":"","data":[]}