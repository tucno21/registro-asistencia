export const APPS_SCRIPT_CODE = `const SHEET_NAMES = ['gradosSecciones', 'estudiantes', 'tiposRegistro', 'registros']

const SHEET_SCHEMAS = {
  gradosSecciones: ['id', 'grado', 'seccion', 'nombre', 'activo', 'updatedAt'],
  estudiantes: ['id', 'codigo', 'nombreCompleto', 'gradoSeccionId', 'activo', 'fechaCreacion', 'updatedAt'],
  tiposRegistro: ['id', 'nombre', 'descripcion', 'categorias', 'activo', 'orden', 'obligatorio', 'updatedAt'],
  registros: ['id', 'estudianteId', 'tipoRegistroId', 'categoriaSeleccionada', 'fecha', 'gradoSeccionId', 'registradoPor', 'fechaCreacion', 'updatedAt']
}

function doGet() {
  return jsonOut({ success: true, message: 'Registro Auxiliar API' })
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents)
    var action = body.action

    ensureSheets()

    if (action === 'init') {
      return jsonOut({ success: true, message: 'Hojas creadas' })
    }

    if (action === 'read') {
      var data = {}
      for (var i = 0; i < SHEET_NAMES.length; i++) {
        data[SHEET_NAMES[i]] = readSheet(SHEET_NAMES[i])
      }
      return jsonOut({ success: true, data: data })
    }

    if (action === 'write') {
      var payload = body.data
      for (var j = 0; j < SHEET_NAMES.length; j++) {
        var name = SHEET_NAMES[j]
        if (payload[name]) {
          writeSheet(name, payload[name])
        }
      }
      return jsonOut({ success: true })
    }

    return jsonOut({ success: false, error: 'Accion no reconocida: ' + action })
  } catch (err) {
    return jsonOut({ success: false, error: String(err) })
  }
}

function ensureSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  for (var i = 0; i < SHEET_NAMES.length; i++) {
    var name = SHEET_NAMES[i]
    var sheet = ss.getSheetByName(name)
    if (!sheet) {
      sheet = ss.insertSheet(name)
    }
    var headers = SHEET_SCHEMAS[name]
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      sheet.setFrozenRows(1)
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold')
    }
  }
}

function readSheet(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)
  if (!sheet) return []
  var lastRow = sheet.getLastRow()
  var lastCol = sheet.getLastColumn()
  if (lastRow < 2 || lastCol < 1) return []

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues()
  var result = []

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i]
    var obj = {}
    var hasId = false
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j]
      var val = row[j]
      if (key === 'categorias') {
        try { obj[key] = JSON.parse(val) } catch (e) { obj[key] = [] }
      } else if (key === 'activo' || key === 'obligatorio') {
        obj[key] = (val === true || val === 'true')
      } else if (key === 'orden') {
        obj[key] = Number(val) || 0
      } else if (val instanceof Date) {
        if (key === 'fecha') {
          obj[key] = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd')
        } else {
          obj[key] = val.toISOString()
        }
      } else {
        obj[key] = val
      }
      if (key === 'id' && val) hasId = true
    }
    if (hasId) result.push(obj)
  }
  return result
}

function writeSheet(name, records) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(name)
  }
  var headers = SHEET_SCHEMAS[name]

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent().clearFormat()
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    sheet.setFrozenRows(1)
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold')
  }

  if (!records || records.length === 0) return

  var data = []
  for (var i = 0; i < records.length; i++) {
    var row = []
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j]
      var val = records[i][key]
      if (key === 'categorias') {
        row.push(val ? JSON.stringify(val) : '[]')
      } else if (val === undefined || val === null) {
        row.push('')
      } else {
        row.push(val)
      }
    }
    data.push(row)
  }

  var dataRange = sheet.getRange(2, 1, data.length, headers.length)
  dataRange.setNumberFormat('@')
  dataRange.setValues(data)
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}`
