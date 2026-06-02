export const utilityAppItemsDb = {
    "map": ["99cb43b3-0569-41b7-b6fc-96803c3b76e9", "bing-maps"],
    "calendar": [ "e1cc6595-abca-4d07-acbb-50c8030333eb", "f3ade7d1-ba3a-4bcd-ac03-032c18a2118d"],
    "email": ["14620318-ed7f-4866-b2cc-da87d4fe3383", "3f1f1820-92be-4f45-a736-25fcf71733d0", "bbdf0fca-c7ea-470f-8035-d9ba02fc5089"],
    "kanban": [ "b9c41567-918a-42f8-911b-e413de67f057", "bb76c358-8f31-437a-987d-7eeb568ae26c"],
    "todo": [ "bbcc11bf-4da7-43b9-ab0b-3f17ca5431bb"],
    "search": ["google", "bing", "duckduckgo", "yahoo", "wikipedia"],
    "cloud": [ "c77ef716-138d-4b2a-835a-932a1b83848b", "c09b5dd2-2803-42ee-8d56-75cdc078c35c" , "0f571d08-9a32-4674-adf5-96ea96a9ed75", "62fd5342-5528-45f2-a5ea-1c77944fd754"],
    "ai": ["d541d75a-2d63-411f-9159-ff1ad92b20a3", "gemini", "claude" , "perplexity" ],
    "note": ["ece26bfd-4921-49e6-a360-81b407f568e4", "d74496e1-8ba1-4cfc-9083-a373c8e3aceb", "7807f54f-3386-4c97-876c-7e55207e9cb0"],
    "stream": ["5e1a8b8f-2584-4b2c-9953-d7ef3eb13a1e", "6bab690d-3c41-45c9-8ef5-96d30915b0f5", "9df46663-b627-4943-91b0-7b102bc10a73", "48c9dab6-f01e-4d93-b086-7daa4ecd798b"],
    "news": [ "3c51e79b-8c60-4301-bf2f-b674bded9644", "bbc"],
    "finance": [],
    "social": ["028b44cc-bb95-437d-81b6-0e6993655cf4", "e3cfed4d-34b1-4ced-a660-60b393ee7c78" , "14456757-c1fd-45cd-8a2e-90892d28ec1a"],
    "shopping": [ "59b7ea29-108f-4346-7f46-02e8s46646a5", "ebay_uk" ,"d2098f5c-ce83-4bed-944b-a727085e90ec", "temu" ],
  }

export const utilityAppSearch = {
    "google":{
        id: "google",
        name: "Google",
        icon: "./images/store/icon/google.png",
        login: "https://www.google.co.uk",
        search: "https://www.google.co.uk/search?q="
    },
    "bing":{
        id: "bing",
        name: "Bing",
        icon: "https://www.bing.com/sa/simg/favicon-2x.ico",
        login: "https://www.bing.com",
        search: "https://www.bing.com/search?q="
    },
    "duckduckgo":{
        id: "duckduckgo",
        name: "Duck Duck Go",
        icon: "https://duckduckgo.com/assets/icons/meta/DDG-iOS-icon_152x152.png",
        login: "https://www.duckduckgo.com",
        search: "https://www.duckduckgo.com/?q="
    },
    "yahoo":{
        id: "yahoo",
        name: "Yahoo",
        icon: "https://s.yimg.com/rz/l/favicon.ico",
        login: "https://www.yahoo.com",
        search: "https://search.yahoo.com/search?p="
    },
    "wikipedia":{
        id: "wikipedia",
        name: "Wikipedia",
        icon: "https://en.wikipedia.org/static/favicon/wikipedia.ico",
        login: "https://www.wikipedia.org",
        search: "https://en.wikipedia.org/w/index.php?search="
    },
}

const _utilityAppOthers = {
    "one-task-manager":{
      id: "one-task-manager",
      name: "Task Manager",
      icon: "./images/store/icon/kanban.svg",
      login: "https://taskboard.onepad.io"

    },
    "one-todo-list":{
        id: "one-todo-list",
        name: "Todo List",
        icon: "/assets/icon/bootstrap/card-checklist.svg",
        login: "https://todolist.onepad.io"
    },
    "one-map":{
      id: "one-map",
      name: "One Map",
      icon: "./images/store/icon/geo.svg",
      login: "https://maps.onepad.io"

    },
    "bing-maps":{
      id: "bing-maps",
      name: "Bing Maps",
      icon: "https://www.bing.com/sa/simg/favicon-2x.ico",
      login: "https://www.bing.com/maps"
    },
    "gemini":{
      id: "gemini",
      name: "Gemini",
      icon: "https://www.gstatic.com/lamda/images/gemini_home_icon_8d62f72e7aae54b6859f1.png",
      login: "https://gemini.google.com/app"
    },
    "perplexity":{
      id: "perplexity",
      name: "Perplexity",
      icon: "./images/store/icon/perplexity.png",
      login: "https://perplexity.ai"
    },
    "claude":{
      id: "claude",
      name: "Claude",
      icon: "https://claude.ai/images/claude_app_icon.png",
      login: "https://claude.ai/"
    },
    "bbc":{
      id: "bbc",
      name: "BBC",
      icon: "https://www.bbc.co.uk/favicon.ico",
      login: "https://www.bbc.co.uk"
    },
    "ebay_uk":{
      id: "ebay_uk",
      name: "Ebay",
      icon: "https://www.ebay.co.uk/favicon.ico",
      login: "https://www.ebay.co.uk"
    },
    "temu":{
      id: "temu",
      name: "Temu",
      icon: "https://www.temu.com/favicon.ico",
      login: "https://www.temu.com"
    }
  };
// combine with search
export const utilityAppOthers = {..._utilityAppOthers, ...utilityAppSearch}
