/**
 * config.gs - IT Management & COSO-ITGC Compliance System
 * รวมค่าคงที่และ Configuration ทั้งหมดของระบบไว้ที่จุดเดียว
 */

// Spreadsheet Configuration
const CONFIG = {
  // Spreadsheet ID (หากว่างไว้ จะใช้ SpreadsheetApp.getActiveSpreadsheet())
  SPREADSHEET_ID: '1A1aHufHX6urFesheo5rzCtc9Zzn_4d8yn5tUqHNIhhc',

  // Sheet Names
  SHEETS: {
    USERS_PROFILE: '01_Users_Profile',
    APPROVE_PROFILE: '02_Approve_Profile',
    IT_ASSET_MASTER: '03_IT_Asset_Master',
    NOTIFY_MESSAGE: '04-Notify_message',
    ACCESS_REQUEST: '11_Access_Request',
    ACCESS_REVIEW: '12_Access_Review',
    ASSET_MOVEMENT: '21_Asset_Movement',
    ASSET_DESTROY: '22_Asset_Destroy',
    OUTSOURCE: '31_Outsource',
    CHANGE_REQ: '41_Change_Req',
    BACKUP_LOG: '51_Backup_Log',
    RECOVERY_TEST: '52_Recovery_Test',
    DRP_TEST: '61_DRP_Test',
    SERVER_ROOM: '71_ServerRoom',
    SYSTEM_LOG: '99_System_Log'
  },

  // Google Doc Template IDs สำหรับสร้าง PDF
  TEMPLATES: {
    FORM_UAR_APPROVE_DOC_ID: '1nQTQrPCPrCe9QBBcngMXHOMOmNh_F3460li3aXtWd30',
    FORM_ACCESS_REVIEW_DOC_ID: '173RELB0cELCK4C2x4mUooX3eo3gdMOl-ibQRnfl6hwk',
    FORM_RECOVERY_TEST_DOC_ID: '1Kb0zndgLTA9w2Q4O_6wUURyQymWvzwHJBp6fzYltxfo',
    FORM_DRP_TEST_DOC_ID: '1W54PQ9Rpk2U-VF7QUR-S4yp9ep2YmH1WJnYjtaoFgJ0',
    FORM_SERVERROOM_DOC_ID: '1i00a2jn_fxUhKwJyWJBDOl7VOeohCIKPd-sj3OxMpj0'
  },

  // Google Drive Folder IDs
  FOLDERS: {
    PDF_FOLDER_ID: '1_mTckRwy-x2Jv6gI6X_EQv0xNhgePaXI',
    UPLOAD_FOLDER_ID: '1gfpC-wrEywCaWDpvWnrEJp8v34xe6TeD'
  },

  // Timezone & Formatting Defaults
  TIMEZONE: 'Asia/Bangkok',
  DATE_FORMAT: 'yyyy-MM-dd HH:mm:ss',

  // LINE Configuration
  LINE_LIFF_ID: '2009018471-SqVJFeJf'
};
