// Standalone Apps Script project. Run setupGuestAlbum once as the owner.
// Deploy as a Web App: execute as Me, access Anyone. Use a dedicated deployment.
// Keep both Drive folders private. Move reviewed JPGs from Pending to Approved.
function setupGuestAlbum() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('APPROVED')) return;
  const root = DriveApp.getFolderById('10DH6kx6PAZGdig2sOAHCgSzqhlgGnQHJ');
  props.setProperties({
    PENDING: root.createFolder('Pending').getId(),
    APPROVED: root.createFolder('Approved').getId()
  });
}

function doPost(e) {
  const id = e.parameter.id || '';
  const photo = e.parameter.photo || '';
  if (!/^[a-f0-9]{32}$/.test(id) || photo.length > 400000 || !/^\/9j\/[A-Za-z0-9+/=]+$/.test(photo)) {
    return ContentService.createTextOutput('Invalid photo');
  }
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const pending = DriveApp.getFolderById(props.getProperty('PENDING'));
    const name = id + '.jpg';
    if (!pending.getFilesByName(name).hasNext()) {
      const approved = DriveApp.getFolderById(props.getProperty('APPROVED'));
      if (!approved.getFilesByName(name).hasNext()) {
        // Bound daily anonymous uploads to protect storage and moderation time.
        const today = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyyMMdd');
        const count = props.getProperty('DAY') === today ? Number(props.getProperty('COUNT')) : 0;
        if (count >= 150) return ContentService.createTextOutput('Daily limit reached');
        pending.createFile(Utilities.newBlob(Utilities.base64Decode(photo), 'image/jpeg', name));
        props.setProperties({DAY: today, COUNT: String(count + 1)});
      }
    }
    return ContentService.createTextOutput('Received');
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const callback = e.parameter.callback || '';
  if (!/^guestAlbum_[a-f0-9]{32}$/.test(callback)) return ContentService.createTextOutput('Invalid request');
  const props = PropertiesService.getScriptProperties();
  const approved = DriveApp.getFolderById(props.getProperty('APPROVED'));
  const id = e.parameter.id || '';
  let data;
  if (/^[a-f0-9]{32}$/.test(id)) {
    const name = id + '.jpg';
    const pending = DriveApp.getFolderById(props.getProperty('PENDING'));
    data = {received: pending.getFilesByName(name).hasNext() || approved.getFilesByName(name).hasNext()};
  } else {
    const files = approved.getFilesByType(MimeType.JPEG);
    const photos = [];
    while (files.hasNext() && photos.length < 12) {
      const file = files.next();
      if (file.getSize() <= 300000) photos.push(Utilities.base64Encode(file.getBlob().getBytes()));
    }
    data = {photos};
  }
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(data) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
