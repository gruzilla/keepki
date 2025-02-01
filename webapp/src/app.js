import QrScanner from 'qr-scanner';

const video = document.getElementsByTagName("video")[0];
const scanResult = document.getElementById("scanResult");
var camList = [];
var highlightTimeout;

const setResult = (result) => {
    console.log(result.data);
    scanResult.textContent = new Date().toString() + " --> " + result.data;
    scanResult.style.color = 'teal';
    clearTimeout(highlightTimeout);
    highlightTimeout = setTimeout(() => label.style.color = 'inherit', 100);
}

const scanner = new QrScanner(video, result => setResult(result), {
    onDecodeError: error => {
    	scanResult.textContent = error;
        scanResult.style.color = 'inherit';
    },
    highlightScanRegion: true,
    highlightCodeOutline: true,
});

scanner.start().then(() => {
    // List cameras after the scanner started to avoid listCamera's stream and the scanner's stream being requested
    // at the same time which can result in listCamera's unconstrained stream also being offered to the scanner.
    // Note that we can also start the scanner after listCameras, we just have it this way around in the demo to
    // start the scanner earlier.
    QrScanner.listCameras(true).then(cameras => cameras.forEach(camera => {
        const option = document.createElement('option');
        option.value = camera.id;
        option.text = camera.label;
        camList.push(option);
    }));
});

// QrScanner.hasCamera().then(hasCamera => {});