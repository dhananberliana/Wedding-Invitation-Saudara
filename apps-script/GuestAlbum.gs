// Standalone Apps Script project. Run setupGuestAlbum once as the owner.
// Deploy as a Web App: execute as Me, access Anyone. Use a dedicated deployment.
// Keep the Drive folders private. New uploads appear directly in the album.
function setupGuestAlbum() {
  const root = DriveApp.getFolderById('17v_T8rhGu9jDwD8VnsgPVYEgYhwGKRbE');
  const folders = root.getFoldersByName('Approved');
  const album = folders.hasNext() ? folders.next() : root.createFolder('Approved');
  PropertiesService.getScriptProperties().setProperty('APPROVED', album.getId());
}

function doPost(e) {
  const id = e.parameter.id || '';
  const photo = e.parameter.photo || '';
  const guest = (e.parameter.guest || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  if (!guest || guest.length > 160) return ContentService.createTextOutput('Invalid guest');
  const guestKey = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, guest)
    .map(byte => ((byte + 256) % 256).toString(16).padStart(2, '0')).join('').slice(0, 32);
  if (!/^[a-f0-9]{32}$/.test(id) || photo.length > 400000 || !/^\/9j\/[A-Za-z0-9+/=]+$/.test(photo)) {
    return ContentService.createTextOutput('Invalid photo');
  }
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const album = DriveApp.getFolderById(props.getProperty('APPROVED'));
    const name = guestKey + '-' + id + '.jpg';
    if (!album.getFilesByName(name).hasNext()) {
      const files = album.getFilesByType(MimeType.JPEG);
      let guestCount = 0;
      while (files.hasNext()) {
        if (files.next().getName().startsWith(guestKey + '-')) guestCount++;
        if (guestCount >= 10) return ContentService.createTextOutput('Guest limit reached');
      }
      const today = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyyMMdd');
      const count = props.getProperty('DAY') === today ? Number(props.getProperty('COUNT')) : 0;
      if (count >= 150) return ContentService.createTextOutput('Daily limit reached');
      album.createFile(Utilities.newBlob(Utilities.base64Decode(photo), 'image/jpeg', name));
      props.setProperties({DAY: today, COUNT: String(count + 1)});
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
    const guest = (e.parameter.guest || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
    const guestKey = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, guest)
      .map(byte => ((byte + 256) % 256).toString(16).padStart(2, '0')).join('').slice(0, 32);
    const files = approved.getFilesByType(MimeType.JPEG);
    let count = 0;
    let received = false;
    while (files.hasNext()) {
      const name = files.next().getName();
      if (name.startsWith(guestKey + '-')) count++;
      if (name === guestKey + '-' + id + '.jpg') received = true;
    }
    data = {received, remaining: Math.max(0, 10 - count), directUpload: true};
  } else {
    const files = approved.getFilesByType(MimeType.JPEG);
    const eligible = [];
    while (files.hasNext()) {
      const file = files.next();
      if (file.getSize() <= 300000) eligible.push(file);
    }
    eligible.sort((a, b) => b.getDateCreated() - a.getDateCreated());
    data = {directUpload: true, photos: eligible.slice(0, 12).map(file => Utilities.base64Encode(file.getBlob().getBytes()))};
  }
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(data) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
