/**
 * Code.js - Main Entry Point & Router for IT Management System
 */

function doGet(e) {
  e = e || { parameter: {} };
  const action = e.parameter.action || '';

  if (action === 'register') {
    return HtmlService.createTemplateFromFile('Form_Register')
      .evaluate()
      .setTitle('ลงทะเบียนข้อมูลพนักงาน (Self-Registration)')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      .setXframeOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (action === 'get_profile') {
    return handleRegistrationDoGet(e);
  }

  return ContentService.createTextOutput("IT Management & COSO-ITGC Compliance System API Active");
}

function doPost(e) {
  e = e || { parameter: {} };
  const action = e.parameter.action || '';

  if (action === 'register_submit') {
    return handleRegistrationDoPost(e);
  }

  return jsonResponse(false, "Invalid action");
}
