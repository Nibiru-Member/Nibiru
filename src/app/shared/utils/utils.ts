export function lowercaseFirstLetterKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => lowercaseFirstLetterKeys(item));
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      const newKey = key.charAt(0).toLowerCase() + key.slice(1);
      newObj[newKey] = lowercaseFirstLetterKeys(obj[key]); // recursive for nested objects
    }
    return newObj;
  }
  return obj; // primitives stay as-is
}
