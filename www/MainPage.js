// Global UI elements _____________________________________________________________________________________________
tabris.ui.set("background", "red");
var MARGIN = 10;

// Main Page
var page = tabris.create("Page", {  
  title: "Data Acquisition",
  Layout: "",
  topLevel: true
});

// Tab Folder for the HTTP- and the Bluetooth-Tabs
var tabFolder = new tabris.TabFolder({ 
  layoutData: {left: 0, top: 0, right: 0, bottom: 0},
  background: "red",
  textColor: "white",
  elevation: 4,
  paging: true // enables swiping. To still be able to open the developer console in iOS, swipe from the bottom right.
}).appendTo(page);

// Tabs __________________________________________________________________________________________________________________

var http_tab = new tabris.Tab({  // HTTP Tab
	title: "HTTP",
	image: {src: "images/at.png", scale: 20},
	background: "white"
}).appendTo(tabFolder);

var bluetooth_tab = new tabris.Tab({ // Bluetooth Tab
	title: "Bluetooth",
	image: {src: "images/bluetooth.png", scale: 20},
	background: "white"
}).appendTo(tabFolder);

// HTTP functionality ____________________________________________________________________________________________________
urlInput = new tabris.TextInput({  // show url input field
	layoutData: {top: 10, left: 10, right: 10},
	message: "Enter URL and confirm",
	text: "http://192.168.178.30:8080/db.json/"
}).on("accept", function(widget, address){
	
	// dispose global widgets
	disposeWidgets(http_tab);

	var xhr = new tabris.XMLHttpRequest();  // create XMLHttpRequest
	
	var statusText = new tabris.TextView({
		id: "deleteMe",
		layoutData: {left: 2 * MARGIN, right: 2 * MARGIN, top: [urlInput, MARGIN]},
		text: "",
		alignment: "center"
	}).appendTo(http_tab);
	
	xhr.onreadystatechange = function() {
					
		if (xhr.readyState === 4) { // ready for receiving response
			if(xhr.status === 200){	// success case, respone received
				displayData(xhr.responseText, urlInput, http_tab); // call the display fcn
			
			} else { // error case
				statusText.set("text", "URL invalid: " + xhr.status); 
			}
		}else{
			statusText.set("text", "Data request..."); 
		}
	};			

	xhr.open("GET", address);
	
	xhr.send();
}).appendTo(http_tab);

// Bluetooth functionality _______________________________________________________________________________________________

var btRadioButtons =  ["Scan for Devices", "Enter MAC / UUID"];

btRadioButtons.forEach(function(title) {
  new tabris.RadioButton({
    layoutData: {left: 10, top: "prev() 10", height: 20},
    text: title
  }).on("change:selection", function(widget, selection) {
	  
		// dispose widgets
		disposeWidgets(bluetooth_tab);
			
		// disconnect any established connections
		bluetoothSerial.disconnect();
		
		if (widget.get("text") == "Scan for Devices") {
			
			bluetoothSerial.enable(function(){ // enable BT
				bluetoothSerial.isEnabled(function(){ // success callback
					scanBluetoothConnection();	// scanning routine
				}, function(){
					console.log("Couldn't scan for Bluetooth devices!");
				})
			}, function(){
				console.log("Couldn't enable Bluetooth!");
			});			
			
		}
		else if(widget.get("text") == "Enter MAC / UUID"){
			
			bluetoothSerial.enable(function(){ // enable BT
				bluetoothSerial.isEnabled(function(){ // success callback
					manualBluetoothConnection();	// enter MAC routine
				}, function(){
					console.log("Direct connection to the device failed!");
				})
			}, function(){
				console.log("Couldn't enable Bluetooth!");
			});			
		}
	
	}).appendTo(bluetooth_tab);
});

// scan bt functionality with collectionView ___________
function scanBluetoothConnection(){

	// Scan button incl. functionality
	var bleEnableButton = tabris.create("Button", {
		id: "deleteMe",
		text: "Scan",
		textColor: "white",
		background: "red",
		layoutData: {right: MARGIN, top: MARGIN}
	});
	
	// button event
	bleEnableButton.on("select", function(){
		
		// dispose scanning widgets
		disposeWidgetsByID(bluetooth_tab, "deleteMe_scan");
		
		// waiting text ...
		var waitingText = new tabris.TextView({
			id: "deleteMe_scan",
			layoutData: {centerX: 0, centerY: 0},
		}).appendTo(bluetooth_tab);
			
		bluetoothSerial.isEnabled(function(){
			
			// set the waiting text
			waitingText.set("text", "Scanning for unpaired devices...");
			
			// discover unpaired bluetooth devices
			bluetoothSerial.discoverUnpaired(function(devices) {
				
			
				// disconnect any established connections
				bluetoothSerial.disconnect();
				
				// log the devices found
				console.log(devices.length + " Device(s) found!\n\n");
				
				// update waitingText if no devices were found
				if(devices.length < 1){
					waitingText.set("text", "No devices found, try again!");
				}
				else{
					// dispose the waiting text
					waitingText.dispose();
				}
				
				// device variable
				var scannedDevices = [];
				
				// parse all devices found
				devices.forEach(function(device, i) {
					console.log("name: " + device.name + "\nID: " + device.id);
					scannedDevices[i] = [device.name, device.id]; // this means: scannedDevices[i][0] = name etc.
				})
				
				// create a collectionView for the devices found
				var collectionView = new tabris.CollectionView({
					id: "deleteMe_scan",
					layoutData: {left: MARGIN, top: [bleEnableButton, 2*MARGIN], right: MARGIN, bottom: MARGIN},
					items: scannedDevices,
					itemHeight: 75,
					initializeCell: function(cell){
						var nameView = new tabris.TextView({
							// layoutData: {left: 20, top: [bleEnableButton, 20], right: 20},
							layoutData: {left: MARGIN, top: MARGIN / 4},
							background: "#cecece",
							alignment: "center"
						}).appendTo(cell);
						var idView = new tabris.TextView({
							layoutData: {left: MARGIN, top: [nameView, MARGIN / 4]},
							alignment: "center"
						}).appendTo(cell);
						cell.on("change:item", function(widget, item){
							nameView.set("text", "Name:\t" + item[0]);
							idView.set("text", "ID:\t" + item[1]);
						});	  
					}
				}).on("select", function(target, value) { 
					
					// outsourced function to connect to a device and reading its data
					connectToDevice(value[1], value[0]);
					
				}).appendTo(bluetooth_tab);
			
			}, function(){
				console.log("failure");// failure
			});
		}, function(){
			var waitingText = new tabris.TextView({
				id: "deleteMe",
				layoutData: {centerX: 0, centerY: 0},
				text: "Bluetooth isn't enabled! Activate it first!"
			}).appendTo(bluetooth_tab);
		});
		
	}).appendTo(bluetooth_tab);
	
}

// mac address / uuid  bt functionality ________________
function manualBluetoothConnection(){
	var macInput = new tabris.TextInput({  // show mac / uuid input field
		id: "deleteMe",
		layoutData: {top: "prev() 10", left: 10, right: 10},
		message: "Enter MAC Adress or UUID",
		text: "48:D7:05:BB:2B:0E"
	}).on("accept", function(widget, address){
	
		connectToDevice(address, address);
	
	}).appendTo(bluetooth_tab);
}

// connect to a bluetooth device______________________
function connectToDevice(adress, name){
	
	if(!adress){
		return -1;
	}
	if(!name){
		var name = "unknown device";
	}
	
	window.plugins.toast.showShortBottom("Connecting to " + name);
	
	// connect to the choosen device
	bluetoothSerial.connect(adress, function(success){ // connection successful
		console.log("Connection to " + name + " successful!");
		
		window.plugins.toast.showShortBottom("Connected to " + name);
		
		disposeWidgets(bluetooth_tab); // clear widgets
		
		// get data button
		var btGetDataButton = new tabris.Button({
			id: "deleteMe",
			text: "Read Data",
			textColor: "white",
			background: "red",
			layoutData: {top: MARGIN, right: MARGIN}
		}).on("select", function(){
			
			// read data from buffer
			bluetoothSerial.read(function(data){
				
				// log the received data
				console.log(data);
				
				// // display the data in a scrollview
				if(displayData(data, btSendDataButton, bluetooth_tab) == -1){
					var waitingText = new tabris.TextView({
						id: "deleteMe",
						layoutData: {centerX: 0, centerY: 0},
						text: "Error reading data!"
					}).appendTo(bluetooth_tab);
				}
				
			}, function(failure){
				console.log("Error reading data from " + name);
			});
			
		}).appendTo(bluetooth_tab);
		
		// // send data button
		var btSendDataButton = new tabris.Button({
			id: "deleteMe",
			text: "Send Testfile",
			textColor: "white",
			background: "red",
			layoutData: {top: [btGetDataButton, MARGIN], right: MARGIN}
		}).on("select", function(){
			
			// var dataToSend = require('./db.json'); // get the JSON File
			// dataToSend = JSON.stringify(dataToSend); // stringify the json objects
			var dataToSend = "Hello World!\n";
			console.log(dataToSend);
			
			bluetoothSerial.write(dataToSend, function(success){// success callback
				
				console.log("Data should have been sent!");
				
			}, function(failure){ // failure callback
				console.log("Error writing data to " + name + "\nbluetoothSerial.write() failure callback");
			});
			
		}).appendTo(bluetooth_tab);
		
		
		
	}, function(failure){
		console.log("Connection to " + name + " failed!");
		window.plugins.toast.showLongBottom("Couldn't connect to " + name);
	});
	
	return 1;
}


// actions on tab change_____________________________________________________________________________________________________
tabFolder.on("change:selection", function(widget, tab) {
	if(tab.name == "HTTP"){
    	
	}
	else{ // bluetooth case
	  
	}
});

page.open();


// Display Data functionality _______________________________________________________________________________________________
var displayData=function(responseData, topWidgetObject, tabToAppendTo){  // Data Management

	var receivedData = 0;
	
	// dispose the data display and the graphing stuff separately
	// bluetooth_tab.children().forEach(function(element, index, array){
		// if(element.id === "displayDeletion"){
			// element.dispose();
		// }
	// })
	disposeWidgetsByID(bluetooth_tab, "displayDeletion");
		
	
	try{
		// create a variable to save the received object data
		receivedData = JSON.parse(responseData);
	}
	catch(error){
		console.log("Error parsing the received data: " + error);
		return -1;
	}
	
	// parse the received data 
	var stringData = "";
	receivedData.forEach(function(s, i, o){
		stringData = stringData + receivedData[i].firstName + "\n" + receivedData[i].age + "\n\n";
	})

	var composite = new tabris.Composite({
		id: "displayDeletion",
		layoutData: {left: MARGIN, bottom: MARGIN, right: MARGIN},
		background: "white"
	}).appendTo(tabToAppendTo);

	var drawButton = new tabris.Button({
		text: "Draw graph",
		textColor: "white",
		background: "red",
		layoutData: {left: MARGIN, centerY: 0}
	}).appendTo(composite);

	var chartPicker = new tabris.Picker({
		layoutData: {right: MARGIN, centerY: 0},
		textColor: "black",
		items: ["Bar", "Line", "Radar"] // "PolarArea", "Pie", "Doughnut"
	}).appendTo(composite);
	
	if(topWidgetObject) // 
	{
		// create a scrollview if the received data exceeds the display size
		var dataScrollView = tabris.create("ScrollView", {
			id: "displayDeletion",
			left: MARGIN, right: MARGIN, top: [topWidgetObject, MARGIN], bottom: [composite, 2 * MARGIN],
			direction: "vertical",
			background: "white"
		}).appendTo(tabToAppendTo);
	}else{
		// create a scrollview if the received data exceeds the display size
		var dataScrollView = tabris.create("ScrollView", {
			id: "displayDeletion",
			left: MARGIN, right: MARGIN, top: MARGIN, bottom: [composite, 2 * MARGIN],
			direction: "vertical",
			background: "white"
		}).appendTo(tabToAppendTo);	
	}
	
	var responseText = tabris.create("TextView", {
		layoutData: {left: 2 * MARGIN, right: 2 * MARGIN, top: [dataScrollView, 2 * MARGIN]},
		text: stringData
	}).appendTo(dataScrollView);

	drawButton.on("select", function(){
		// create a chart, offering the received data 
		createChart(receivedData, chartPicker.get("selection"));
	});
	
	return 1;
}

// Create Chart functionality _______________________________________________________________________________________________
function createChart(receivedData, chartType){  // Chart
	var Chart = require("./node_modules/chart.js/Chart.min.js");	
	
	var visuPage = new tabris.Page({title: "Data Visualization"});  	// create a non-toplevel page for data visualization
	
	var labels = [];
    var yData =[];
	
	receivedData.forEach(function(s,i,o){ 
		labels[i] = receivedData[i].firstName;
		yData[i] = receivedData[i].age;
	})
	
	// chart data according to chart.js
	var chartData = {
		labels: labels,
		datasets: [
		{
			label: "My first bar chart",
			fillColor: "rgba(220,220,220,0.2)",
			strokeColor: "rgba(220,220,220,1)",
			pointColor: "rgba(220,220,220,1)",
			pointStrokeColor: "#fff",
			pointHighlightFill: "#fff",
			pointHighlightStroke: "rgba(220,220,220,1)",
			data: yData
		}
		]
	};
	
	// create a canvas and submit its data to the chart.js-constructor to create a chart
	var canvas = new tabris.Canvas({
		layoutData: { left: MARGIN, top: MARGIN, right: MARGIN, bottom: MARGIN }
	}).on("resize", function(canvas, bounds) {
		// get the size of the canvas context
		var ctx = canvas.getContext("2d", bounds.width, bounds.height);
		
		// wraparound to scale with native pixels
		ctx.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);
		
		// create the chart using the chart.js-constructor
		new Chart(ctx)[chartType](chartData, {
			animation: true,
			showScale: true,
			showTooltips: false,
			scaleShowLabels: true
		});
	}).appendTo(visuPage);

	visuPage.open();
}

// Dispose  Widgets _______________________________________________________________________________________________
function disposeWidgets(container){
	
	try{
		container.children().forEach(function(element, index, array){
			if(element.id === "deleteMe" || element.id === "displayDeletion" || element.id === "deleteMe_scan"){
				element.dispose();
			}
		})
	}catch(error){
		container.dispose();
	}
}

function disposeWidgetsByID(container, id){
	container.children().forEach(function(element, index, array){
		if(element.id === id){
			element.dispose();
		}
	});
}