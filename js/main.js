//insert code here!
var map;
var minValue;
var dataStats = {};
var dic ={};
var attrArray = ["Metal", "Textiles"];
var timeArray = [2016, 2017, 2018, 2019, 2020, 2021]
var expressed = attrArray[0] + '_' + timeArray[0].toString;



//function to instantiate the Leaflet map
function createMap(){
    dic ={"Metal":"Metal_export_sample.geojson", 
          "Non-Fillet_Frozen_Fish":"frozenFish_export_sample.geojson"
        };
    //create the map
    map = L.map('map').setView([30, 0], 2); // setView([lat, long], Zoom)
    //add OSM base tilelayer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    getData();
};

function getData(){
  fetch("data/Metal_export_sample.geojson")
  .then(function(response){
    return response.json();
  })
  .then(function(json){
    var attributes = processData(json); //create an attributes array
    minValue = calcStats(json);
    createPropSymbols(json, attributes);
    createLegend(attributes, "Metal");
    createSequenceControls(attributes);
  })
  .then(function(){
    var attrName = document.getElementsByClassName('attrName');
    for(let i = 0; i < attrName.length; i++){
      attrName[i].addEventListener('click', function (){
        var id = this.getAttribute("id");
        for(const key of Object.keys(dic)){
          if (id === key){
            var img = document.getElementById("spikeLine");
            img.src = `img/${id}.png`;
            updateMap(dic[id], id);
          }
        }
      });
    }
  })
};

function updateMap(file, mapName){
  fetch("data/"+file)
  .then(function(response){
    return response.json();
  })
  .then(function(json){
    var attributes = processData(json); //create an attributes array
    minValue = calcStats(json);
    deleteElement()
    createPropSymbols(json, attributes);
    createLegend(attributes, mapName);
    createSequenceControls(attributes, mapName);
  })
}

function deleteElement(){
  
  document.querySelector(".sidebar-legend").innerHTML = "";
  
  var symbol = document.getElementsByClassName("leaflet-interactive");

  let size = symbol.length;

  for (let i = 0; i < size; i++){
    symbol[0].remove();
 
  }

}

function getName(data){
  properties2 = data.features[0].properties;
  
  return properties2["Name"]
}

function processData(data){
  var attributes = [];    //empty array to hold attributes
  var properties = data.features[0].properties;       //properties of the first feature in the dataset

  //push each attribute name into attributes array
  for (var attribute in properties){
      attributes.push(attribute);

  };
  return attributes;
};

function calcStats(data){
  //create empty array to store all data values
  var allValues = [];
  //loop through each station
  for(var country of data.features){
      //loop through each year
      for(var year = 2016; year <= 2021; year+=1){
        //get ridership for current year
          var value = country.properties[String(year)];
          //add value to array
          if (value != 0){
          allValues.push(value);
          }
      }
  };
  //get min, max, mean stats for our array
  dataStats.min = Math.min(...allValues);
  dataStats.max = Math.max(...allValues);
  
  //calculate meanValue
  var sum = allValues.reduce(function(a, b){return a+b;});
  dataStats.mean = sum/ allValues.length;
  
  //get minimum value of our array
  var minValue = Math.min(...allValues)
  return minValue;
};

function createPropSymbols(data, attributes){
  //create a Leaflet GeoJSON layer and add it to the map
  L.geoJson(data, {
      pointToLayer: function(feature, latlng){
          return pointToLayer(feature, latlng, attributes);
      }
  }).addTo(map);
};

function pointToLayer(feature, latlng, attributes){
  //Determine which attribute to visualize with proportional symbols
  var attribute = attributes[0];
  //create marker options
  var options = {
      fillColor: "#ff7800",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
  };

  var attValue = Number(feature.properties[attribute]);   //For each feature, determine its value for the selected attribute
  options.radius = calcPropRadius(attValue);  //Give each feature's circle marker a radius based on its attribute value

  //create circle marker layer
  var layer = L.circleMarker(latlng, options);
  //build popup content string
  var popupContent = createPopupContent(feature.properties, attribute)

  //bind the popup to the circle marker
  layer.bindPopup(popupContent, {
      offset: new L.Point(0,-options.radius) 
  });
  return layer;   //return the circle marker to the L.geoJson pointToLayer option
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
  //constant factor adjusts symbol sizes evenly
  var minRadius = 3;
  //Flannery Apperance Compensation formula
  var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius
  return radius;
};

function createLegend(attributes, mapName){

    // create the control container with a particular class name
      var container = document.querySelector(".sidebar-legend");

      //PUT YOUR SCRIPT TO CREATE THE TEMPORAL LEGEND HERE
      container.insertAdjacentHTML("beforeend",`<p class="temporalLegend">${mapName} in year <span class="year">2016</span> (USD)</p>`);
      //Step 1: start attribute legend svg string
      var svg = '<svg id="attribute-legend" width="400px" height="120px">';
      //array of circle names to base loop on
      var circles = ["max", "mean", "min"];

      //Step 2: loop to add each circle and text to svg string
      for (var i=0; i<circles.length; i++){
          
          //Step 3: assign the r and cy attributes  
          var radius = calcPropRadius(dataStats[circles[i]]);  
          var cy = 80 - radius;  
          //circle string
          svg += '<circle class="legend-circle" id="' + 
          circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="210"/>'; 
          
          //evenly space out labels            
          var textY = i * 20 + 35;            
          //text string            
          svg += '<text id="' + circles[i] + '-text" x="250" y="' + textY + '">' + Math.round(dataStats[circles[i]]/1000000)+ ' Million</text>';

      };
      //close svg string
      svg += "</svg>";
      
      //add attribute legend svg to container
      container.insertAdjacentHTML('beforeend',svg);
      // container.innerHTML += svg;

};

// create UI control
function createSequenceControls(attributes, mapName){
  var container = document.querySelector(".sidebar-legend");
      container.insertAdjacentHTML('beforeend', '<p class="slider-label">Year: <span class="slider-year">2016</span></p>')
      container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')
  
  
  /*var SequenceControl = L.Control.extend({
      options: {
          position: 'bottomleft'
      },

      onAdd: function () {
          // create the control container div with a particular class name
          var container = L.DomUtil.create('div', 'sequence-control-container');
          //create range input element (slider)
          container.insertAdjacentHTML('beforeend', '<p class="slider-label">Year: <span class="slider-year">2016</span></p>')
          container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')
          //disable any mouse event listeners for the container
          L.DomEvent.disableClickPropagation(container);

          return container;
      }
  });*/

  //map.addControl(new SequenceControl());    // add listeners after adding control}

  //set slider attributes
  document.querySelector(".range-slider").max = 5;
  document.querySelector(".range-slider").min = 0;
  document.querySelector(".range-slider").value = 0;
  document.querySelector(".range-slider").step = 1;
  // if (mapName){
  //   // Update title attribute name
  //   var titleAttr = document.querySelector('.titleAttr');
  //   titleAttr.innerHTML = mapName;}
  //   else{
  //     //pass
  //   }

  //Step 5: input listener for slider
  document.querySelector('.range-slider').addEventListener('input', function(){            
      //Step 6: get the new index value
      var index = this.value;
      //Step 9: pass new attribute to update symbols
      updatePropSymbols(attributes[index]);
  });
};

function createPopupContent(properties, attribute){
  //add StationName and formatted attribute (ridership data) to popup content string
  var popupContent = "<p><b>Country name:</b> " + properties.Name + "</p>";
  var year = attribute;
  popupContent += "<p><b>From:</b> the United States</p>";
  properties[attribute] == 0 ? popupContent += "0 Value":
  popupContent += "<p><b>Year: " + year + ":</b>" + properties[attribute] + "</p>";
  return popupContent;
};

function updatePropSymbols(attribute){
  var year = attribute;
  //update temporal legend
  document.querySelector("span.year").innerHTML = year;
  yearChange = document.querySelectorAll("span.slider-year")
  for (let i=0; i < yearChange.length; i++){
    yearChange[i].innerHTML = year;
  }
  


  map.eachLayer(function(layer){
      if (layer.feature && layer.feature.geometry.type == "Point"){
          //update the layer style and popup
          var props = layer.feature.properties;   //access feature properties

          //update each feature's radius based on new attribute values
          var radius = calcPropRadius(props[attribute]);
          layer.setRadius(radius);
          var popupContent = createPopupContent(props, attribute)

          //update popup content            
          popup = layer.getPopup();            
          popup.setContent(popupContent).update();
      }
  });
};



function setdropdown(){
    var dropdown = document.getElementsByClassName("dropdown-btn");
    var cateOpt = document.getElementsByClassName("cateName");
    var i;

    for (i = 0; i < dropdown.length; i++) {
      dropdown[i].addEventListener("click", function() {
        this.classList.toggle("active");

        var dropdownContent = this.nextElementSibling;

        var dropdownDiv = dropdownContent.querySelectorAll('div');
        for (let j = 0; j < dropdownDiv.length; j++){
          dropdownDiv[j].style.display = "none";
        }
        if (dropdownContent.style.display === "block") {
          dropdownContent.style.display = "none";
        } else {
          dropdownContent.style.display = "block";
        }
      });
    }

    for (i = 0; i < cateOpt.length; i++) {
      cateOpt[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var dropdownContent = this.nextElementSibling;
        if (dropdownContent.style.display === "block") {
          dropdownContent.style.display = "none";
        } else {
          dropdownContent.style.display = "block";
        }
      });
    }
}


document.addEventListener('DOMContentLoaded',createMap)
document.addEventListener('DOMContentLoaded',setdropdown)