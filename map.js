// Set the map
let map = L.map('map').setView([48.13, -1.64], 7);

// Add the OSM background
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "\n" + "© <a href=https://www.openstreetmap.org/copyright>Contributeurs d’OpenStreetMap</a>",
    maxZoom: 19,
}).addTo(map);

// Parse geojson data as a JS object
let jsonData = JSON.parse(document.getElementById("json-data").textContent);

// Define a function to be called on each point, to set up the popup
function onEachPoint(feature, layer) {
    let popupContent = `<p><strong>${feature.properties.name}</strong><br />${feature.properties.website}<br />${feature.properties.type}<br />Du ${feature.properties.startDate} au ${feature.properties.endDate}<br />${feature.properties.free ? "Gratuit" : "Payant"}</p>`
    layer.bindPopup(popupContent);
    feature.alt = feature.properties.name;
}
// Generate the layer / Leaflet data from the geojson
let festivalsLayer = L.geoJSON(jsonData, {onEachFeature: onEachPoint}).addTo(map);

// Zoom on user location
map.locate({setView: true, maxZoom: 11});

// Add a control to filter the festivals
let festivalsFilter = L.control("topright");
festivalsFilter.onAdd = function () {
    let div = L.DomUtil.create('div', 'filter');
    // HTML form
    div.innerHTML = `<form name="festival-filter" id="festival-filter" class="form-filter">
                        <fieldset>
                        <legend>Type</legend>
                            <div class="form-filter">
                                <input type="checkbox" name="type" id="type-festival" value="festival" checked>
                                <label for="type-festival">Festival / fête</label>
                            </div>
                            <div>
                                <input type="checkbox" name="type" id="type-marche" value="marche" checked>
                                <label for="type-marche">Marché médiéval</label>
                            </div>
                            <div>
                                <input type="checkbox" name="type" id="type-culture" value="culturel" checked>
                                <label for="type-culture">Festival culturel</label>
                            </div>
                        </fieldset>
                        <div class="form-filter">
                            <label for="free">Gratuit uniquement :</label>
                            <input type="checkbox" name="free" id="free" value="True">
                        </div>
                        <div class="form-filter">
                            <label for="start-date">Entre le </label>
                            <input type="date" name="start-date" id="start-date">
                            <label for="end-date"> et le </label>
                            <input type="date" name="end-date" id="end-date">
                        </div>
                    </form>`
    // HTML button to submit the form
    let button = L.DomUtil.create('button', 'filter-button', div);
    button.innerHTML = "Filtrer";
    // Javascript listener
    L.DomEvent.on(button, "click", (div) => filterSubmit(div), this);
    return div;
}

// Get the form data, and filter the festivals
function filterSubmit(div) {
    const form = document.getElementById("festival-filter");
    let formData = new FormData(form);
    // Remove the layers, then re-import the data to apply the filter function
    map.removeLayer(festivalsLayer);
    festivalsLayer = L.geoJSON(jsonData,
    {
        onEachFeature: onEachPoint,
        filter: function (feature) {
            let startDate = formData.get("start-date");
            let endDate = formData.get("end-date");
            if (formData.has("free") && !feature.properties.free)
                return false;
            if (!formData.getAll("type").includes(feature.properties.type))
                return false;
            // Multiple tests depending on wether the user input both dates, only one of them, or none
            if (startDate) {
                if (endDate) {
                    // Both dates
                    if (!((feature.properties.startDate >= startDate && feature.properties.startDate <= endDate) ||
                        (feature.properties.endDate >= startDate && feature.properties.endDate <= endDate)))
                        return false;
                } else if (feature.properties.endDate < startDate) // Only start date
                    return false;
            } else if (endDate) {
                // Only end date
                if (feature.properties.startDate > endDate)
                    return false;
            }
            return true;
        }
    }).addTo(map);

    return div;
}

map.addControl(festivalsFilter);
