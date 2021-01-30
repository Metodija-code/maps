//// Globals

const currentAccuracyDisplay = document.getElementById("accuracy-display");
const currentLatitudeDisplay = document.getElementById("latitude-display");
const currentLongitudeDisplay = document.getElementById("longitude-display");
const panToMeBtn = document.querySelector(".locateMe-btn");
let startMarker;
let endMarker;
let polyLine;

//// testing

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
          // console.log(this.counter);
          currentAccuracyDisplay.textContent = accuracy.toFixed(2);
          currentLatitudeDisplay.textContent = lat.toFixed(6);
          currentLongitudeDisplay.textContent = lon.toFixed(6);

          // my view

          this.mymap.setView([lat, lon], 25);

          /// set my coords

          this.myCurrentCoords.latitude = lat;
          this.myCurrentCoords.longitude = lon;

          // console.log(this.myCurrentCoords.latitude);

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
        this.latLngtLine = [];
      }

      this.resetBtn.classList.add("hide-btn");
      this.startBtn.classList.remove("hide-btn");
    });

    this.startBtn.addEventListener("click", (e) => {
      if (e.target.textContent === "Start") {
        e.target.textContent = "Stop";
        this.isDrawing = true;
      } else if (e.target.textContent === "Stop") {
        e.target.textContent = "Start";
        this.isDrawing = false;

        // draw start-end Markers

        if (polyLine && polyLine.getLatLngs().length > 1) {
          this.startEndMarker = polyLine.getLatLngs();
          this.startEndMarker.splice(1, this.startEndMarker.length - 2);

          startMarker = L.marker([
            this.startEndMarker[0].lat,
            this.startEndMarker[0].lng,
          ])
            .bindPopup("Start")
            .addTo(this.mymap);
          endMarker = L.marker([
            this.startEndMarker[1].lat,
            this.startEndMarker[1].lng,
          ])
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

      polyLine = L.polyline(startArr, {
        color: "red",
      }).addTo(this.mymap);

      this.latLngtLine.push(startArr);
    }

    this.counter += 2;

    if (this.counter === this.checkPoint) {
      this.latLngtLine.push([
        this.myCurrentCoords.latitude,
        this.myCurrentCoords.longitude,
      ]);

      /// update polyline polyline

      polyLine.addLatLng(this.latLngtLine[this.latLngtLine.length - 1]);
      // console.log("line draw");

      this.checkPoint += 200;
    }
  }
}

const map = new Map();

/// Event Listeners

window.addEventListener("DOMContentLoaded", () => {
  map.locateMe();
});
