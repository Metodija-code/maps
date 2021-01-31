//// Globals

const currentAccuracyDisplay = document.getElementById("accuracy-display");
const currentLatitudeDisplay = document.getElementById("latitude-display");
const currentLongitudeDisplay = document.getElementById("longitude-display");
const panToMeBtn = document.querySelector(".locateMe-btn");
let startMarker;
let endMarker;
let polyLine;
let localStoPolyLine;
let startStoMarker;
let endStoMarker;
let myView = true;

/// import externals

// initialize map holder
const mapHolder = document.querySelector(".mapid");

class Map {
  constructor() {
    this.mapHolder = document.querySelector(".mapid");
    this.myCurrentCoords = {
      latitude: 0,
      longitude: 0,
    };
    this.currentPositionMarker;
    this.currentAccuracy;
    this.counter = 0;
    this.isDrawing = false;
    this.startBtn = document.querySelector(".myButton");
    this.resetBtn = document.getElementById("reset");
    this.latLngtLine = [];
    this.checkPoint = 200;
    this.mymap = L.map(this.mapHolder);
    this.initializePosition = [];
    this.startEndMarker = [];
  }

  locateMe() {
    /// initiqalize the map

    //const mymap = L.map(this.mapHolder);
    const attribution =
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const tiles = L.tileLayer(tileUrl, { attribution });
    tiles.addTo(this.mymap);

    /////

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          let lat = position.coords.latitude;
          let lon = position.coords.longitude;
          let accuracy = position.coords.accuracy;

          // display on screen

          currentAccuracyDisplay.textContent = accuracy.toFixed(2);
          currentLatitudeDisplay.textContent = lat.toFixed(6);
          currentLongitudeDisplay.textContent = lon.toFixed(6);

          // my view

          if (myView) {
            this.mymap.setView([lat, lon], 17);
            myView = false;
          }

          /// set my coords

          this.myCurrentCoords.latitude = lat;
          this.myCurrentCoords.longitude = lon;

          if (this.currentPositionMarker) {
            this.mymap.removeLayer(this.currentPositionMarker);
            this.mymap.removeLayer(this.currentAccuracy);
          }

          this.currentPositionMarker = L.marker([lat, lon]).addTo(this.mymap);

          this.currentAccuracy = L.circle([lat, lon], accuracy / 2, {
            weight: 1,
            color: "blue",
            fillColor: "rgba(47, 60, 240, 0.473)",
            fillOpacity: 0.3,
          });

          this.mymap.addLayer(this.currentAccuracy);

          if (accuracy <= 30) {
            this.mymap.removeLayer(this.currentAccuracy);
          }

          ///// start drawing
          if (this.isDrawing) {
            this.startDrawing(this.mymap);
          }
        },
        () => {
          alert("Initializng HighAccuracy");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );

      ///////////////////// interval is up to here

      //// panToMeBtn

      panToMeBtn.addEventListener("click", () => {
        this.myCurrentCoords.latitude !== 0
          ? this.mymap.panTo([
              this.myCurrentCoords.latitude,
              this.myCurrentCoords.longitude,
            ])
          : alert("initialazing location");
      });
    }

    if (!"geolocation" in navigator) {
      alert("Position not available");
    }

    this.initializeDrawing(this.mymap);

    // /////
  }

  initializeDrawing(map) {
    // initialize drawing

    this.resetBtn.addEventListener("click", () => {
      if (polyLine) {
        map.removeLayer(startMarker);
        map.removeLayer(endMarker);
        map.removeLayer(polyLine);
        this.startEndMarker = [];
        this.counter = 0;
        this.checkPoint = 200;
        this.isDrawing = false;
      }

      if (localStoPolyLine) {
        map.removeLayer(localStoPolyLine);
        map.removeLayer(startStoMarker);
        map.removeLayer(endStoMarker);
      }

      this.resetBtn.classList.add("hide-btn");
      this.startBtn.classList.remove("hide-btn");
    });

    this.startBtn.addEventListener("click", (e) => {
      if (e.target.textContent === "Start") {
        e.target.textContent = "Stop";
        this.isDrawing = true;

        if (localStoPolyLine) {
          map.removeLayer(localStoPolyLine);
          map.removeLayer(startStoMarker);
          map.removeLayer(endStoMarker);
        }
      } else if (e.target.textContent === "Stop") {
        this.latLngtLine = polyLine.getLatLngs();

        e.target.textContent = "Start";
        this.isDrawing = false;
        this.startEndMarker.push([
          this.myCurrentCoords.latitude,
          this.myCurrentCoords.longitude,
        ]);

        this.saveToLocalStorage(this.latLngtLine);

        // draw start-end Markers
        if (this.startEndMarker.length === 2) {
          startMarker = L.marker(this.startEndMarker[0])
            .bindPopup("Start")
            .addTo(this.mymap);

          endMarker = L.marker(this.startEndMarker[1])
            .bindPopup("End")
            .addTo(this.mymap);
        }

        this.resetBtn.classList.remove("hide-btn");
        this.startBtn.classList.add("hide-btn");
      }
    });
  }

  startDrawing(map) {
    if (this.counter === 0) {
      // start polyline point

      const startArr = [
        [this.myCurrentCoords.latitude, this.myCurrentCoords.longitude],
      ];

      this.startEndMarker.push([
        this.myCurrentCoords.latitude,
        this.myCurrentCoords.longitude,
      ]);

      polyLine = L.polyline(startArr, {
        color: "red",
      }).addTo(this.mymap);
    }

    this.counter += 5;

    if (this.counter === this.checkPoint) {
      /// update polyline polyline

      polyLine.addLatLng([
        this.myCurrentCoords.latitude,
        this.myCurrentCoords.longitude,
      ]);

      this.checkPoint += 150;
    }
  }

  saveToLocalStorage(arr) {
    const arrForLocalStorage = arr.map((item) => {
      return [item.lat, item.lng];
    });

    localStorage.setItem("polyLinepoints", JSON.stringify(arrForLocalStorage));
  }

  drawFromLocalStorage() {
    const points = JSON.parse(localStorage.getItem("polyLinepoints"));

    if (points) {
      localStoPolyLine = L.polyline(points, {
        color: "red",
        weight: 3,
      });

      this.mymap.addLayer(localStoPolyLine);
      startStoMarker = L.marker(points[0]).bindPopup("Start").addTo(this.mymap);
      endStoMarker = L.marker(points[points.length - 1])
        .bindPopup("End")
        .addTo(this.mymap);

      this.mymap.setView(points[0], 17);
    }
  }
}

/// map instance
const map = new Map();

/// Event Listeners

window.addEventListener("DOMContentLoaded", () => {
  map.locateMe();
  map.drawFromLocalStorage();
});
