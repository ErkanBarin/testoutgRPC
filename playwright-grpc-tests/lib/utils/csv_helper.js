import fs from 'fs';
import path from 'path';

/**
 * Writes user test data to a CSV file, maintaining only the latest entries
 * 
 * @param {string} filePath Path to the CSV file
 * @param {string} userId User ID to write
 * @param {string} email Email to write
 * @param {number} siteId Site ID to write
 * @param {number} operatorId Operator ID to write
 * @param {number} [maxLines=5] Maximum number of data lines to keep (excluding header)
 */
export function writeUserDataToCsv(filePath, userId, email, siteId, operatorId, maxLines = 5) {
  const header = "user_id,email,site_id,operator_id";
  const line = `${userId},${email},${siteId},${operatorId}`;
  
  let finalLines = [];
  
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const existingLines = content.split('\n').filter(l => l.trim() !== '');
      
      if (existingLines.length > 0 && existingLines[0] === header) {
        // Skip header, keep only data lines
        const dataLines = existingLines.slice(1);
        
        // Keep latest (maxLines-1) lines, plus add the new line
        const oldLines = dataLines.length >= maxLines 
          ? dataLines.slice(-(maxLines - 1)) 
          : dataLines;
          
        finalLines = [header, ...oldLines, line];
      } else {
        console.log(`CSV header mismatch or missing in ${filePath}, starting fresh.`);
        finalLines = [header, line];
      }
    } else {
      // File doesn't exist, create new
      finalLines = [header, line];
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    // Write the file with a trailing newline
    fs.writeFileSync(filePath, finalLines.join('\n') + '\n');
    console.log(`User data written to ${filePath}`);
  } catch (error) {
    console.error(`Error writing to CSV: ${error.message}`);
    throw error;
  }
} 