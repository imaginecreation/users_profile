/**
 * Mod_Registration.js - LINE LIFF Self-Registration Module (REG-001)
 * จัดการ Business Logic ทั้งหมดของระบบลงทะเบียนข้อมูลพนักงานผ่าน LINE LIFF
 */

/**
 * Handler สำหรับ doGet action=register
 * ดึงข้อมูลโปรไฟล์เดิมจาก 01_Users_Profile ตาม Line_UID
 */
function handleRegistrationDoGet(e) {
  try {
    const lineUid = e.parameter.line_uid || e.parameter.lineUid;
    if (!lineUid) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "กรุณาระบุ line_uid"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const sheetData = getSheetData(CONFIG.SHEETS.USERS_PROFILE);
    const existingUser = sheetData.rowObjects.find(r => String(r.Line_UID).trim() === String(lineUid).trim());

    if (existingUser) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        exists: true,
        data: {
          Line_UID: existingUser.Line_UID || '',
          Line_ProfileName: existingUser.Line_ProfileName || '',
          FullNameTH: existingUser.FullNameTH || '',
          FullNameEN: existingUser.FullNameEN || '',
          Emp_Code: existingUser.Emp_Code || '',
          Department: existingUser.Department || '',
          Tel: existingUser.Tel || '',
          Email: existingUser.Email || ''
        }
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        exists: false
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handler สำหรับ doPost action=register_submit
 * บันทึก/อัปเดตข้อมูลพนักงานใน Sheet 01_Users_Profile
 */
function handleRegistrationDoPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "ไม่พบข้อมูลที่ส่งมา (Empty Request Body)"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(e.postData.contents);
    const lineUid = payload.Line_UID ? String(payload.Line_UID).trim() : '';
    const lineProfileName = payload.Line_ProfileName ? String(payload.Line_ProfileName).trim() : '';
    const fullNameTH = payload.FullNameTH ? String(payload.FullNameTH).trim() : '';
    const fullNameEN = payload.FullNameEN ? String(payload.FullNameEN).trim() : '';
    const empCode = payload.Emp_Code ? String(payload.Emp_Code).trim() : '';
    const department = payload.Department ? String(payload.Department).trim() : '';
    const tel = payload.Tel ? String(payload.Tel).trim() : '';
    const email = payload.Email ? String(payload.Email).trim() : '';

    // 1. Validation ฟิลด์บังคับ
    if (!lineUid) return jsonResponse(false, "ไม่พบข้อมูล Line_UID");
    if (!fullNameTH) return jsonResponse(false, "กรุณากรอกชื่อ-นามสกุล (TH)");
    if (!fullNameEN) return jsonResponse(false, "กรุณากรอกชื่อ-นามสกุล (EN)");
    if (!empCode) return jsonResponse(false, "กรุณากรอกรหัสพนักงาน");
    if (!department) return jsonResponse(false, "กรุณาเลือกหน่วยงาน");
    if (!tel) return jsonResponse(false, "กรุณากรอกเบอร์โทรศัพท์");

    // ตรวจสอบเบอร์โทรเป็นตัวเลข 9-10 หลัก
    const telClean = tel.replace(/[- ]/g, '');
    if (!/^\d{9,10}$/.test(telClean)) {
      return jsonResponse(false, "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก");
    }

    let isUpdate = false;

    // 2. ใช้ LockService ครอบขั้นตอนการเช็คและบันทึก
    executeWithLock(function() {
      const sheet = getSheetByName(CONFIG.SHEETS.USERS_PROFILE);
      const sheetData = getSheetData(CONFIG.SHEETS.USERS_PROFILE);
      const headers = sheetData.headers;
      const rowObjects = sheetData.rowObjects;

      // 3. ตรวจสอบ Emp_Code ซ้ำกับ Line_UID อื่นหรือไม่
      const duplicateEmp = rowObjects.find(r => 
        String(r.Emp_Code).trim() === empCode && 
        String(r.Line_UID).trim() !== lineUid
      );

      if (duplicateEmp) {
        throw new Error("รหัสพนักงานนี้ถูกลงทะเบียนไว้แล้ว กรุณาติดต่อ IT หากคิดว่าเป็นข้อผิดพลาด");
      }

      // 4. ตรวจสอบว่า Line_UID มีอยู่อยู่แล้วหรือไม่ (Insert หรือ Update)
      const existingUserRow = rowObjects.find(r => String(r.Line_UID).trim() === lineUid);

      const timestamp = getCurrentTimestamp();

      if (existingUserRow) {
        // === UPDATE ===
        isUpdate = true;
        const rowIndex = existingUserRow._rowIndex; // แถวใน Sheet (1-indexed)
        const currentRowValues = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];

        // สร้าง Array ค่าใหม่สำหรับอัปเดต โดยห้ามแตะ Is_Active และ Scr_01-Scr_17
        const updatedRowValues = headers.map((header, colIdx) => {
          const key = String(header).trim();
          if (key === 'Line_UID') return lineUid;
          if (key === 'Line_ProfileName') return lineProfileName || currentRowValues[colIdx];
          if (key === 'FullNameTH') return fullNameTH;
          if (key === 'FullNameEN') return fullNameEN;
          if (key === 'Emp_Code') return empCode;
          if (key === 'Department') return department;
          if (key === 'Tel') return telClean;
          if (key === 'Email') return email;
          if (key === 'Last_Update') return timestamp;
          
          // คอลัมน์ Is_Active และ Scr_01 ถึง Scr_17 ห้ามเขียนทับ ใช้ค่าเดิมเสมอ!
          return currentRowValues[colIdx];
        });

        sheet.getRange(rowIndex, 1, 1, updatedRowValues.length).setValues([updatedRowValues]);

      } else {
        // === INSERT NEW ===
        isUpdate = false;

        // สร้าง Array แถวใหม่สำหรับ Insert
        const newRowValues = headers.map(header => {
          const key = String(header).trim();
          if (key === 'Line_UID') return lineUid;
          if (key === 'Line_ProfileName') return lineProfileName;
          if (key === 'FullNameTH') return fullNameTH;
          if (key === 'FullNameEN') return fullNameEN;
          if (key === 'Emp_Code') return empCode;
          if (key === 'Department') return department;
          if (key === 'Tel') return telClean;
          if (key === 'Email') return email;
          if (key === 'Is_Active') return 'Yes'; // Default สำหรับ Insert ใหม่
          if (key === 'Last_Update') return timestamp;
          
          // Scr_01 - Scr_17 ปล่อยว่าง / No
          if (key.startsWith('Scr_')) return '';
          return '';
        });

        sheet.appendRow(newRowValues);
      }

      // 5. บันทึก Log ลง 99_System_Log
      writeSystemLog("Registration", isUpdate ? "UPDATE" : "INSERT", {
        Line_UID: lineUid,
        Emp_Code: empCode,
        FullNameTH: fullNameTH,
        Department: department
      });
    }, 15000);

    // 6. ส่ง LINE Push Message สรุปข้อมูล (ครอบ try...catch แยกต่างหาก ห้ามทำให้ Transaction Fail)
    try {
      sendRegistrationPushMessage(lineUid, {
        FullNameTH: fullNameTH,
        FullNameEN: fullNameEN,
        Emp_Code: empCode,
        Department: department,
        Tel: telClean,
        Email: email
      });
    } catch (pushErr) {
      Logger.log("LINE Push Message failed: " + pushErr.toString());
    }

    return jsonResponse(true, "บันทึกข้อมูลเรียบร้อยแล้ว", { isUpdate: isUpdate });

  } catch (err) {
    return jsonResponse(false, err.message || err.toString());
  }
}

/**
 * ส่ง LINE Push Message สรุปข้อมูลการลงทะเบียนกลับไปยังผู้ใช้
 */
function sendRegistrationPushMessage(lineUid, data) {
  const channelAccessToken = CONFIG.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    Logger.log("LINE_CHANNEL_ACCESS_TOKEN is missing in CONFIG");
    return;
  }

  const messageText = 
    `✅ บันทึกข้อมูลลงทะเบียนเรียบร้อย\n\n` +
    `ชื่อ-นามสกุล (TH): ${data.FullNameTH}\n` +
    `ชื่อ-นามสกุล (EN): ${data.FullNameEN}\n` +
    `รหัสพนักงาน: ${data.Emp_Code}\n` +
    `แผนก: ${data.Department}\n` +
    `เบอร์โทร: ${data.Tel}\n` +
    `อีเมล: ${data.Email || '-'}\n\n` +
    `หากข้อมูลไม่ถูกต้อง กรุณาเปิดลิงก์เดิมเพื่อแก้ไขได้ทันที`;

  const payload = {
    to: lineUid,
    messages: [
      {
        type: "text",
        text: messageText
      }
    ]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + channelAccessToken
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", options);
  Logger.log("LINE Push Response: " + response.getContentText());
}

/**
 * Helper สรุปการตอบกลับ JSON
 */
function jsonResponse(success, message, extraData) {
  const res = Object.assign({ success: success, message: message }, extraData || {});
  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}
