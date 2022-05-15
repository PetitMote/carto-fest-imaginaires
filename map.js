let map = L.map('map').setView([48.13, -1.64], 7);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "\n" + "© <a href=https://www.openstreetmap.org/copyright>Contributeurs d’OpenStreetMap</a>",
    maxZoom: 19,
}).addTo(map);

let jsonData = JSON.parse(document.getElementById("json-data").textContent);

function onEachPoint(feature, layer) {
    let popupContent = `<p><strong>${feature.properties.name}</strong><br />${feature.properties.website}<br />${feature.properties.type}<br />Du ${feature.properties.startDate} au ${feature.properties.endDate}<br />${feature.properties.free ? "Gratuit" : "Payant"}</p>`
    layer.bindPopup(popupContent);
    feature.alt = feature.properties.name;
}

let festivalsLayer = L.geoJSON(jsonData, {onEachFeature: onEachPoint}).addTo(map);

map.locate({setView: true, maxZoom: 11});

let festivalsFilter = L.control("topright");
festivalsFilter.onAdd = function (map) {
    let div = L.DomUtil.create('div', 'filter');
    div.innerHTML = `<form name="festival-filter" id="festival-filter" class="form-filter">
                        <fieldset>
                        <legend>Type</legend>
                            <div class="form-filter">
                                <input type="checkbox" name="type" id="type-festival" value="festival" checked>
                                <label for="type-festival">Festival</label>
                            </div>
                            <div>
                                <input type="checkbox" name="type" id="type-marche" value="marche" checked>
                                <label for="type-marche">Marché médiéval</label>
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
    let button = L.DomUtil.create('button', 'filter-button', div);
    button.innerHTML = "Filtrer";
    // Cet event semble faire buguer l’exécution, c’est quasiment copié du tuto de shevek
    L.DomEvent.on(button, "click", (div) => filterSubmit(div), this);
    return div;
}

function filterSubmit(div) {
    const form = document.getElementById("festival-filter");
    let formData = new FormData(form);

    map.removeLayer(festivalsLayer);
    festivalsLayer = L.geoJSON(jsonData,
    {
        onEachFeature: onEachPoint,
        filter: function (feature) {
            let startDate = formData.get("start-date");
            let endDate = formData.get("end-date");
            if (formData.has("free") && feature.properties.free)
                return false;
            if (!formData.getAll("type").includes(feature.properties.type))
                return false;
            if (startDate) {
                if (endDate) {
                    if (!((feature.properties.startDate >= startDate && feature.properties.startDate <= endDate) ||
                        (feature.properties.endDate >= startDate && feature.properties.endDate <= endDate)))
                        return false;
                } else if (feature.properties.endDate < startDate)
                    return false;
            } else if (endDate) {
                if (feature.properties.endDate > endDate)
                    return false;
            }
            return true;
        }
    }).addTo(map);

    return div;
}

map.addControl(festivalsFilter);