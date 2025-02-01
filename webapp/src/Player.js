import QrScanner from 'qr-scanner';

export default class Player {
	constructor() {
        this.video = document.getElementById("qrCodeScanner");
        this.scanResult = document.getElementById("scanResult");
        this.camList = [];
        this.highlightTimeout = null;
        this.scanner = new QrScanner(
        	this.video,
        	this.setResult,
        	{
			    onDecodeError: error => {
			    	this.scanResult.textContent = error;
			        this.scanResult.style.color = 'inherit';
			    },
			    highlightScanRegion: true,
			    highlightCodeOutline: true,
			}
		);

		this.scanner.start().then(() => {
		    // List cameras after the scanner started to avoid listCamera's stream and the scanner's stream being requested
		    // at the same time which can result in listCamera's unconstrained stream also being offered to the scanner.
		    // Note that we can also start the scanner after listCameras, we just have it this way around in the demo to
		    // start the scanner earlier.
		    QrScanner.listCameras(true).then(cameras => cameras.forEach(camera => {
		        const option = document.createElement('option');
		        option.value = camera.id;
		        option.text = camera.label;
		        this.camList.push(option);
		    }));
		});
    }

    setResult(result) {
	    console.log(result.data);
	    this.scanResult.textContent = new Date().toString() + " --> " + result.data;
	    this.scanResult.style.color = 'teal';
	    clearTimeout(this.highlightTimeout);
	    this.highlightTimeout = setTimeout(() => this.scanResult.style.color = 'inherit', 100);
	}

}