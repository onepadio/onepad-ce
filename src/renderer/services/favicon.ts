export const getFavicon = (url: any) => `https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`

  export const getGoogleFavicon = (url: any) => `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=256`