import QrScanner from 'qr-scanner';

export default class Player {
	constructor(name) {
        this.video = document.getElementsByTagName("video")[0];
        this.scanResult = document.getElementById("scanResult");
        this.camList = [];
        this.highlightTimeout = null;
        this.scanner = new QrScanner(
        	video,
        	this.setResult,
        	{
			    onDecodeError: error => {
			    	scanResult.textContent = error;
			        scanResult.style.color = 'inherit';
			    },
			    highlightScanRegion: true,
			    highlightCodeOutline: true,
			}
		);

		scanner.start().then(() => {
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