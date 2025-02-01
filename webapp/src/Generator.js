import QRCode from 'qrcode'

export default class Generator {
	constructor() {
		this.qrCode = document.getElementById("qrCode");
		QRCode.toDataURL(crypto.randomUUID())
		  .then(url => {
		  	console.log(url);
		    this.qrCode.src = url;
		  })
		  .catch(err => {
		    console.error(err);
		  });
	}
}