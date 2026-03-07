// src/utils/colorUtils.js

// A map to convert color names we use into hex codes
const colorNameToHex = {
  gray: '#808080',
  red: '#DC143C',
  orange: '#FFA500',
  yellow: '#FFD700',
  lime: '#00FF00',
  green: '#228B22',
  cyan: '#00FFFF',
  blue: '#0000FF',
  indigo: '#4B0082',
  purple: '#800080',
  pink: '#FFC0CB',
  brown: '#A52A2A',
};

export const isColorDark = (color) => {
  if (!color || typeof color !== 'string') return false;

  let hex = color.toLowerCase();
  
  // If the color is a name in our map, convert it to its hex value
  if (colorNameToHex[hex]) {
    hex = colorNameToHex[hex];
  }

  // --- DIRECT FIX FOR YELLOW ---
  if (hex.includes('yellow') || hex.includes('#ffd700') || hex.includes('#ffff00')) {
    return false; // Not dark, use black text
  }

  const hexCode = hex.charAt(0) === '#' ? hex.substring(1) : hex;
  const fullHex = hexCode.length === 3 ? hexCode.split('').map(char => char + char).join('') : hexCode;
  const rgb = parseInt(fullHex, 16);
  
  if (isNaN(rgb)) return false;

  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  
  return luma < 160;
};