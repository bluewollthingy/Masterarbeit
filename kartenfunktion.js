document.addEventListener('DOMContentLoaded', function () {
    // --- Karten-Initialisierung und Marker-Erstellung ---
    const map = L.map('mapStart', { zoomControl: false }).setView([51.04, 13.72], 13);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const tile_layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    const markersLayer = L.layerGroup().addTo(map);
    
    let jsonData; // Globale Variable für JSON-Daten
    const searchInput = document.getElementById('searchInput');
    
    // JSON-Daten laden und Marker erstellen
    fetch('data_gastro.json')
      .then(response => response.json())
      .then(data => {
        jsonData = data;
        jsonData.forEach((location) => {
          const marker = createMarker(location);
          if (marker) {
            markersLayer.addLayer(marker);
          }
        });
      })
      .catch(error => console.error('Error fetching data:', error));
    
    // Umschaltung der Startseite
    const button = document.getElementById("mehr-button");
    const header = document.getElementById("main-header");
    if (button && header) {
      button.addEventListener("click", () => {
        header.classList.add("hidden");
        document.getElementById("mapStart").style.height = "100vh";
    
        let miniHeader = document.getElementById("mini-header");
        if (!miniHeader) {
          miniHeader = document.createElement("div");
          miniHeader.id = "mini-header";
          miniHeader.textContent = "Die Dresdner Gastronomie der 1980er Jahre";
          document.body.appendChild(miniHeader);
        }
        miniHeader.style.display = "block";
        button.style.display = "none";
    
        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      });
    }
    
    // Suchleiste: Filtere Marker
    searchInput.addEventListener('input', handleSearch);
    function handleSearch() {
      const searchTerm = searchInput.value.toLowerCase();
      markersLayer.clearLayers();
      jsonData.forEach(location => {
        const name = location.Name.toLowerCase();
        const plz = location.PLZ.toLowerCase();
        const address = location.Straße.toLowerCase();
        if (name.includes(searchTerm) || plz.includes(searchTerm) || address.includes(searchTerm)) {
          markersLayer.addLayer(createMarker(location));
        }
      });
    }
    
    // Menü: Öffne/Schließe die Seitenleiste
    const menuButton = document.querySelector('.menu');
    const overlay = document.querySelector('.sidenav');
    if (menuButton && overlay) {
      menuButton.addEventListener('click', function () {
        overlay.classList.toggle('open');
      });
    }
    
    // Dropdown: Umschalten der Dropdown-Inhalte
    const dropdown = document.getElementsByClassName("dropdown-btn");
    for (let i = 0; i < dropdown.length; i++) {
      dropdown[i].addEventListener("click", function() {
        this.classList.toggle("active");
        const dropdownContent = this.nextElementSibling;
        if (dropdownContent.style.display === "block") {
          dropdownContent.style.display = "none";
        } else {
          dropdownContent.style.display = "block";
        }
      });
    }
    
    // Kategorie-Filter für Marker
    let activeRechtsformen = [];
    let activeGastroTypen = [];

    document.querySelectorAll('.Rechtsform').forEach((element) => {
      element.addEventListener('click', function () {
        const value = this.textContent.trim();
        toggleCategory(value, 'rechtsform');
        element.classList.toggle('active');
      });
    });
    // Mapping zwischen dem angezeigten Dropdown-Text und den Werten in der JSON
    const gastroMapping = {
      "Speisegaststätte": "Speiserestaurant",
      "Café": "Café",
      "Nationalitätenrestaurant": "Nationalitätenrestaurant",
      "Interhotel": "Interhotel",
      "Weinrestaurant": "Weinrestaurant"
    };

    // Beim Klick auf einen Filter-Button für Gastronomietypen:
    document.querySelectorAll('.ArtderGastro').forEach((element) => {
      element.addEventListener('click', function () {
        // Ursprünglichen Text extrahieren und mappen
        let value = this.textContent.trim();
        value = gastroMapping[value] || value; // Falls kein Mapping existiert, nutze den Originalwert

        // Dann den Filter anwenden:
        toggleCategory(value, 'gastro');
        this.classList.toggle('active');
      });
    });

    function toggleCategory(value, type) {
      let targetArray = type === 'rechtsform' ? activeRechtsformen : activeGastroTypen;
    
      const index = targetArray.indexOf(value);
      if (index > -1) {
        targetArray.splice(index, 1);
      } else {
        targetArray.push(value);
      }
    
      filterMarkers();
    }

    function filterMarkers() {
      markersLayer.clearLayers();
      jsonData.forEach((location) => {
        const marker = createMarker(location);
        if (!marker) return;
        
        // Für Rechtsformen funktioniert es bereits, da hier vermutlich der Schlüssel korrekt ist.
        const rechtsformMatch =
          activeRechtsformen.length === 0 || activeRechtsformen.includes(location.Rechtsform);
        
        // Für die Gastronomietypen den korrekten Schlüssel verwenden:
        const gastroMatch =
          activeGastroTypen.length === 0 || activeGastroTypen.includes(location["Art der Gastro"]);
        
        // Wenn keiner Filter aktiv ist, oder wenn eine der beiden Bedingungen erfüllt ist (ODER-Verknüpfung)
        // (Falls du wirklich eine ODER-Verknüpfung möchtest, statt beider Bedingungen gleichzeitig zu verlangen)
        if (rechtsformMatch && gastroMatch) {
          markersLayer.addLayer(marker);
        }
      });
    }
    
    // Funktion zum Erstellen eines Markers
    function createMarker(location) {
      if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
        const marker = L.marker([location.latitude, location.longitude]);
        marker.customInfo = {
          name: location.Name.toLowerCase(),
        };
        let popupContent = `<h2>${location.Name}</h2><br>`;
        for (const key in location) {
          if (key !== 'latitude' && key !== 'longitude' && key !== 'Name' && key !== 'Bilder') {
            popupContent += `<strong>${key}:</strong> ${location[key]}<br>`;
          }
        }
        if (location.Bilder && Array.isArray(location.Bilder)) {
          location.Bilder.forEach((Bilder) => {
            console.log('Bilder:', location.Bilder);
            popupContent += `
              <figure>
                <img src="${Bilder.url}" alt="${Bilder.alt}" style="width: 300px;">
                <figcaption>${Bilder.bildunterschrift}</figcaption>
              </figure>`;
          });
        }
        marker.bindPopup(popupContent, { maxHeight: 300, maxWidth: 320 });
        return marker;
      } else {
        console.error('Invalid coordinates for:', location.Name);
        return null;
      }
    }
    
    // Event-Listener für öffnen aller Info-Boxen
    document.querySelectorAll('.Interviews, .menu-btn').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('data-info');
        const infoBox = document.getElementById(targetId);
        if (infoBox) {
          infoBox.classList.add('active');
          infoBox.setAttribute('aria-hidden', 'false');
          infoBox.focus();
        }
      });
    });
    
    // Event-Listener für alle "Schließen"-Buttons in den Info-Boxen
    document.querySelectorAll('.info-box .close-info').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const infoBox = this.closest('.info-box');
        if (infoBox) {
          // Info-Box ausblenden
          infoBox.classList.remove('active');
          infoBox.setAttribute('aria-hidden', 'true');
          
          // Setze den aktiven Status zurück
          const targetId = infoBox.id; 
          document.querySelectorAll('.Interviews, .menu-btn').forEach(function(link) {
            if (link.getAttribute('data-info') === targetId) {
              link.classList.remove('active');
            }
          });
          
          // Marker-Schicht zurücksetzen: Alle Marker neu hinzufügen
          markersLayer.clearLayers();
          jsonData.forEach((location) => {
            const marker = createMarker(location);
            if (marker) {
              markersLayer.addLayer(marker);
            }
          });
          
        }
      });
    });
    // Mapping: Weist jeder Info-Box das passende Transkript-Modale zu.
    const transcriptMapping = {
      "info-andreas": "transcript-modal-wuensche",
      "info-frank": "transcript-modal-gliemann"
    };

    // Öffne das Transkript-Modale, wenn der "Weiter lesen"-Button in einer Info-Box geklickt wird.
    document.querySelectorAll('.info-box .weiter-lesen').forEach(function(btn) {
      btn.addEventListener('click', function() {
        // Ermittle die Info-Box, in der der Button liegt.
        const infoBox = this.closest('.info-box');
        if (infoBox && transcriptMapping[infoBox.id]) {
          // Optionale Schließung der Info-Box:
          infoBox.classList.remove('active');
          infoBox.setAttribute('aria-hidden', 'true');
          
          // Öffne das zugehörige Transkript-Modale:
          const transcriptId = transcriptMapping[infoBox.id];
          const transcriptModal = document.getElementById(transcriptId);
          if (transcriptModal) {
            transcriptModal.classList.add('active');
            transcriptModal.setAttribute('aria-hidden', 'false');
            transcriptModal.focus(); // Fokus setzen für Barrierefreiheit.
          }
        }
      });
    });

    // Schließen der Transkript-Modale über den Schließen-Button.
    document.querySelectorAll('.transcript-modal .close-transcript').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const transcriptModal = this.closest('.transcript-modal');
        if (transcriptModal) {
          transcriptModal.classList.remove('active');
          transcriptModal.setAttribute('aria-hidden', 'true');
          // Optional: Fokus zurück an einen relevanten Interview-Link setzen.
          document.querySelector('.Interviews').focus();
        }
      });
    });

    // Beobachtet Scroll-Verhalten im Modal
    document.querySelectorAll('.transcript-modal').forEach(modal => {
      const scrollBtn = modal.querySelector('.scroll-top-t');
      const content = modal.querySelector('.transcript-content-wuensche, .transcript-content-gliemann');

      content.addEventListener('scroll', () => {
        if (content.scrollTop > 300) {
          scrollBtn.style.display = 'block';
        } else {
          scrollBtn.style.display = 'none';
        }
      });

      scrollBtn.addEventListener('click', () => {
        content.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    });

    function groupByCoordinates(data) {
      const groups = {};
    
      data.forEach(item => {
        const key = `${item.lat},${item.lng}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
    
      return groups;
    }

    function renderGroupedMarkers() {
      const groups = groupByCoordinates(jsonData);
      markersLayer.clearLayers();
    
      Object.entries(groups).forEach(([key, items]) => {
        const [lat, lng] = key.split(',').map(Number);
    
        const marker = L.marker([lat, lng]);
        const content = items.map(entry => `<strong>${entry.Name}</strong> (${entry.ArtderGastro})`).join('<br>');
    
        marker.bindPopup(`<div><strong>${items[0].Gebäude}</strong><br>${content}</div>`);
        markersLayer.addLayer(marker);
      });
    }
    
    

  });
  