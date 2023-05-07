//insert code here!
var map;
var minValue;
var dataStats = {};
var dic ={};
var info;

//function to instantiate the Leaflet map
function createMap(){
    dic ={"Non-Fillet Frozen Fish":"frozenFish_export.geojson",
          "Non-Fillet Fresh Fish":"freshFish_Export.geojson",
          "Fish Fillets":"fishFillets_Export.geojson",
          "Machinery Mechanical Appliances & Parts":"MMAP_Export.geojson",
          "Electrical Machinery and Electrics":"EME_Export.geojson",
          "Machines":"machine_Export.geojson",
          "Organic Chemicals":"Organic_Chemicals_Export.geojson",
          "Chemical":"Chemical_Export.geojson",
          "Halogenated Hydrocarbons":"Halogenated_Hydrocarbons_Export.geojson",
          "Metal":"Metal_export.geojson",
          "Textiles":"Textiles_Export.geojson"
        };
    //create the map
    map = L.map('map').setView([30, 0], 2); // setView([lat, long], Zoom)
    //add OSM base tilelayer
    L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abcd',
      minZoom: 0,
      maxZoom: 20,
      ext: 'png'
    }).addTo(map);
    createInfoPanel();
    getData();
};

function getData(){
  fetch("data/Metal_export.geojson")
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
    createPropSymbols(json, attributes, mapName);
    createLegend(attributes, mapName);
    createSequenceControls(attributes, mapName);
  })
}

//create a info panel
function createInfoPanel(properties, attribute){
  info = L.control();

  info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
      this.update();
      return this._div;
  };
  
  //update the panel based on feature properties passed
  info.update = function (properties, attribute) {
      this._div.innerHTML = '<h4>US Export Value</h4>' +  
      (properties ?
          '<b>' + properties.Name + '</b><br />' + Math.round(properties[attribute]/1000)*1000 + '(USD)'
          : 'Select a symbol');
  };
  
  info.addTo(map);
}

//delete DOM elements when refresh the web page
function deleteElement(){
  
  document.querySelector(".sidebar-legend").innerHTML = "";
  
  var symbol = document.getElementsByClassName("leaflet-interactive");

  let size = symbol.length;

  for (let i = 0; i < size; i++){
    symbol[0].remove();
 
  }
};

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

function createPropSymbols(data, attributes, mapName){
  //create a Leaflet GeoJSON layer and add it to the map
  L.geoJson(data, {
      pointToLayer: function(feature, latlng){
          return pointToLayer(feature, latlng, attributes, mapName);
      }
  }).addTo(map);
};

function pointToLayer(feature, latlng, attributes, mapName){
  //Determine which attribute to visualize with proportional symbols
  var attribute = attributes[0];
  //create marker options
  var options = {
      fillColor: "#D1AB41",
      color: "#000",
      weight: 1,
      opacity: 0.8,
      fillOpacity: 0.6
  };

  var attValue = Number(feature.properties[attribute]);   //For each feature, determine its value for the selected attribute
  if (mapName === 'Non-Fillet Fresh Fish' || mapName ==='Electrical Machinery and Electrics'){
    options.radius = calcPropRadius2(attValue);
    } else{      
      options.radius = calcPropRadius1(attValue);
    }  //Give each feature's circle marker a radius based on its attribute value
  
  //create circle marker layer
  var layer = L.circleMarker(latlng, options);

  //pass the variables into the infopanel
  layer.on({
    mouseover:function(e){
        info.update(feature.properties, attribute)
    },

    mouseout: function(){
        info.update()
    }, 

    click: function(e){
        coord = e.latlng
        map.setView([coord.lat, coord.lng], 5);
    }

  })
  return layer;   //return the circle marker to the L.geoJson pointToLayer option
};

//calculate the radius of each proportional symbol
function calcPropRadius2(attValue) {
  //constant factor adjusts symbol sizes evenly
  var minRadius = 1;
  //Flannery Apperance Compensation formula
  var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius
  return radius;
};


//calculate the radius of each proportional symbol
function calcPropRadius1(attValue) {
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
      container.insertAdjacentHTML("beforeend",`<p class="temporalLegend">${mapName}</p>`);
      //Step 1: start attribute legend svg string
      var svg = '<svg id="attribute-legend" width="400px" height="120px">';
      //array of circle names to base loop on
      var circles = ["max", "mean", "min"];

      //Step 2: loop to add each circle and text to svg string
      for (var i=0; i<circles.length; i++){
        if (mapName === 'Non-Fillet Fresh Fish' || mapName ==='Electrical Machinery and Electrics'){
          var radius = calcPropRadius2(dataStats[circles[i]]);  
          var cy = 80 - radius;  
          //circle string
          svg += '<circle class="legend-circle" id="' + 
          circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#D1AB41" fill-opacity="0.8" stroke="#000000" cx="210"/>'; 
          
          //evenly space out labels            
          var textY = i * 20 + 35;            
          //text string            
          svg += '<text id="' + circles[i] + '-text" x="250" y="' + textY + '">' + Math.round(dataStats[circles[i]]/1000000)+ ' Million</text>';
        } else{
          //Step 3: assign the r and cy attributes  
          var radius = calcPropRadius1(dataStats[circles[i]]);  
          var cy = 80 - radius;  
          //circle string
          svg += '<circle class="legend-circle" id="' + 
          circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#D1AB41" fill-opacity="0.8" stroke="#000000" cx="210"/>'; 
          
          //evenly space out labels            
          var textY = i * 20 + 35;            
          //text string            
          svg += '<text id="' + circles[i] + '-text" x="250" y="' + textY + '">' + Math.round(dataStats[circles[i]]/1000000)+ ' Million</text>';
        }
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

  //set slider attributes
  document.querySelector(".range-slider").max = 5;
  document.querySelector(".range-slider").min = 0;
  document.querySelector(".range-slider").value = 0;
  document.querySelector(".range-slider").step = 1;

  //Step 5: input listener for slider
  document.querySelector('.range-slider').addEventListener('input', function(){            
      //Step 6: get the new index value
      var index = this.value;
      //Step 9: pass new attribute to update symbols
      updatePropSymbols(attributes[index], mapName);
  });
};

function createPopupContent(properties, attribute){ 
  //add StationName and formatted attribute (ridership data) to popup content string
  var popupContent = "<p><b>Country name:</b> " + properties.Name + "</p>";
  var year = attribute;
  properties[attribute] == 0 ? popupContent += "0 Value":
  popupContent += "<p><b>Year: " + year + ":</b>" + properties[attribute] + "</p>";
  return popupContent;
};

function updatePropSymbols(attribute, mapName){
  var year = attribute;
  //update temporal legend
  console.log(year)
  yearChange = document.querySelectorAll("span.slider-year")
  for (let i=0; i < yearChange.length; i++){
    yearChange[i].innerHTML = year;
  }

  map.eachLayer(function(layer){
      if (layer.feature && layer.feature.geometry.type == "Point"){
        //update the layer style and popup
        var props = layer.feature.properties;   //access feature properties
        //update each feature's radius based on new attribute values
        if (mapName === 'Non-Fillet Fresh Fish' || mapName ==='Electrical Machinery and Electrics'){
          var radius = calcPropRadius2(props[attribute]);
        } else{
        var radius = calcPropRadius1(props[attribute]);}
        layer.setRadius(radius);

        //update the new input for the infopanel
        layer.on({
          mouseover:function(e){
              info.update(props, attribute)
          },

          mouseout: function(e){
              info.update()
          }, 

          click: function(e){
              coord = e.latlng
              map.setView([coord.lat, coord.lng], 5);
          }
        });
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