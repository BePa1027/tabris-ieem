// Impressum //////////////////////////////////////////////////////

var page = tabris.create("Page", {
  title: "Impressum",
  topLevel: true
});

impressumScrollView = tabris.create("ScrollView", {
	left: 0, right: 0, top: 0, bottom: 0,
	direction: "vertical",
	background: "white"
}).appendTo(page);

var textView = tabris.create("TextView", {
	font: "22px",
	layoutData: {left: 50, top: 20},
	text: "Autoren:\n\nPatrick Bechtold - B.Eng. \nPhilipp Leopold - B.Eng."
}).appendTo(impressumScrollView);

var textView2 = tabris.create("TextView", {
	font: "18px",
	layoutData: {left: 20, right: 20, top: [textView, 50]},
	text: "Beispielapplikation zur Kommunikation via Bluetooth- und HTTP-Verbindungen."
}).appendTo(impressumScrollView);

var textView3 = tabris.create("TextView", {
	font: "18px",
	layoutData: {left: 20, right: 20, top: [textView2, 50]},
	text: "Applikation erstellt mit dem TabrisJS-Framework."
}).appendTo(impressumScrollView);

var textView4 = tabris.create("TextView", {
	font: "18px",
	layoutData: {left: 20, right: 20, top: [textView3, 50]},
	text: "Copyright 2016 - Institut f\u00fcr Energieeffiziente Mobilit\u00e4t"
}).appendTo(impressumScrollView);


var createImageView = function(scaleMode) {
  new tabris.ImageView({
    layoutData: {centerX: 0, top: [textView4, 30], width: 300, height: 100},
    image: {src: "./images/IEEM.png"},
    background: "white",
    scaleMode: scaleMode
  }).appendTo(impressumScrollView);
};



createImageView("fit");