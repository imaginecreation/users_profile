/**
 * Utils.js - Utility functions for IT Management System
 * รวมฟังก์ชันส่วนกลางสำหรับการจัดการ Spreadsheet, Log, Lock และอื่น ๆ
 */

/**
 * ดึง Spreadsheet Object
 */
function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * ดึง Sheetตามชื่อที่ระบุ
 */
function getSheetByName(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`ไม่พบ Sheet ชื่อ "${sheetName}" ใน Spreadsheet`);
  }
  return sheet;
}

/**
 * ดึงข้อมูลทั้งหมดใน Sheet เป็น Array of Objects
 */
function getSheetData(sheetName) {
  const sheet = getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { headers: data[0] || [], rows: [], rowObjects: [] };
  
  const headers = data[0].map(h => String(h).trim());
  const rows = data.slice(1);
  
  const rowObjects = rows.map((row, idx) => {
    const obj = { _rowIndex: idx + 2 }; // Line number in sheet (1-indexed, header is 1)
    headers.forEach((h, colIdx) => {
      obj[h] = row[colIdx];
    });
    return obj;
  });
  
  return { headers, rows, rowObjects };
}

/**
 * บันทึก Log ลงใน Sheet 99_System_Log ตามโครงสร้าง Audit Trail
 * Fields: Log_ID | Timestamp | Line_UID | Module_Name | Action_Type | Raw_JSON
 */
function writeSystemLog(moduleName, actionType, rawJson, lineUid) {
  try {
    const sheet = getSheetByName(CONFIG.SHEETS.SYSTEM_LOG);
    const now = new Date();
    const dateStr = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyyMMddHHmmss");
    const randDigits = Math.floor(Math.random() * 8999 + 1000);
    const logId = "LOG-" + dateStr + "-" + randDigits;
    const timestamp = Utilities.formatDate(now, CONFIG.TIMEZONE, CONFIG.DATE_FORMAT);
    const actorUid = lineUid || (typeof rawJson === 'object' && rawJson.Line_UID ? rawJson.Line_UID : '');
    const jsonStr = typeof rawJson === 'object' ? JSON.stringify(rawJson) : String(rawJson);
    
    sheet.appendRow([logId, timestamp, actorUid, moduleName, actionType, jsonStr]);
  } catch (err) {
    Logger.log("writeSystemLog error: " + err.toString());
  }
}

/**
 * รัน Callback โดยครอบ LockService.getScriptLock()
 */
function executeWithLock(callback, timeoutMs) {
  const lock = LockService.getScriptLock();
  const timeout = timeoutMs || 10000; // default 10 seconds
  const success = lock.tryLock(timeout);
  if (!success) {
    throw new Error("ระบบกำลังมีการประมวลผลอื่นอยู่ กรุณาลองใหม่อีกครั้งในอีกสักครู่");
  }
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

/**
 * ฟอร์แมตวันที่ปัจจุบันเป็น String ตาม Config
 */
function getCurrentTimestamp() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, CONFIG.DATE_FORMAT);
}
