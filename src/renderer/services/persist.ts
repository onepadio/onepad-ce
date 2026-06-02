export function setItem(key: any, item: any) {
    localStorage.setItem(key, JSON.stringify(item));
}
  
export function getItem(key: any){
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
}
  