const CONFIG = {
  SPREADSHEET_ID: 'ضع_هنا_ID_ملف_GOOGLE_SHEETS',
  SHEETS: {
    'اصلاحات': ['اسم الزبون', 'الموديل', 'وصف العطب', 'الثمن', 'الحالة', 'تاريخ الإضافة'],
    'مشتريات': ['الاسم', 'الكمية', 'الأولوية', 'الحالة', 'ملاحظة', 'تاريخ الإضافة']
  }
};

function doGet(e) {
  try {
    const name = String((e.parameter || {}).sheet || '');
    const sheet = getSheet_(name);
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return json_({ok:true,data:[]});
    const headers = values[0].map(String);
    const rows = values.slice(1).map((row, i) => {
      const item = {_row:i + 2};
      headers.forEach((h,j) => item[h] = row[j] instanceof Date
        ? Utilities.formatDate(row[j], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')
        : row[j]);
      return item;
    }).filter(item => headers.some(h => item[h] !== '' && item[h] !== null));
    return json_({ok:true,data:rows});
  } catch (err) { return json_({ok:false,error:String(err.message || err)}); }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    const sheet = getSheet_(String(body.sheet || ''));
    const action = String(body.action || '');
    if (action === 'add') {
      const data = body.data || {};
      const headers = CONFIG.SHEETS[body.sheet];
      const row = headers.map(h => data[h] === undefined ? '' : data[h]);
      sheet.appendRow(row);
      return json_({ok:true,message:'added'});
    }
    const rowNumber = Number(body.row);
    if (!Number.isInteger(rowNumber) || rowNumber < 2 || rowNumber > sheet.getLastRow()) {
      throw new Error('رقم السطر غير صالح');
    }
    if (action === 'delete') {
      sheet.deleteRow(rowNumber);
      return json_({ok:true,message:'deleted'});
    }
    if (action === 'update') {
      const data = body.data || {};
      const headers = CONFIG.SHEETS[body.sheet];
      headers.forEach((h, i) => {
        if (Object.prototype.hasOwnProperty.call(data, h)) {
          sheet.getRange(rowNumber, i + 1).setValue(data[h]);
        }
      });
      return json_({ok:true,message:'updated'});
    }
    throw new Error('العملية غير معروفة');
  } catch (err) {
    return json_({ok:false,error:String(err.message || err)});
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getSheet_(name) {
  if (!Object.prototype.hasOwnProperty.call(CONFIG.SHEETS, name)) {
    throw new Error('اسم اللائحة غير معروف');
  }
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  const headers = CONFIG.SHEETS[name];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    const existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (headers.some((h, i) => String(existing[i] || '') !== h)) {
      throw new Error('عناوين الأعمدة في ورقة ' + name + ' غير مطابقة. راجع الصف الأول.');
    }
  }
  return sheet;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
