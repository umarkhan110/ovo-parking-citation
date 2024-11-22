import { Checkbox, MantineProvider, Modal, Button } from "@mantine/core";
import React, { useEffect, useState, useRef } from "react";
import Nav from "./Nav";
import CouncilDist from "../data/CouncilDistricts.json";
import citybounds from "../data/citybounds.json";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mantine/core/styles.css";
import geoData from "../data/HomelessnessDashboardMaps-InterimHousing_geocoded.json";
import "../node_modules/@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

const optionsCd = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "10", label: "10" },
  { value: "11", label: "11" },
  { value: "12", label: "12" },
  { value: "13", label: "13" },
  { value: "14", label: "14" },
  { value: "15", label: "15" },
];

// Updated HUD classification types
const projTypes = [
  { value: "ES", label: "Emergency Shelter" },
  { value: "TH", label: "Transitional Housing" },
  { value: "SH", label: "Safe Haven" },
];

// Population served options
const populationServed = [
  { value: "Family", label: "Family" },
  { value: "Re-entry", label: "Re-entry" },
  { value: "General Population", label: "General Population" },
  { value: "Winter Shelter", label: "Winter Shelter" },
  { value: "Recovery", label: "Recovery" },
  { value: "DHS", label: "DHS" },
  { value: "DMH", label: "DMH" },
  { value: "Veteran", label: "Veteran" },
  { value: "Youth", label: "Youth" },
  { value: "Senior", label: "Senior" },
  { value: "Recuperative Care", label: "Recuperative Care" },
  { value: "Women", label: "Women" },
];

// New project type filter options
const projectType = [
  { value: "Tiny Home Village", label: "Tiny Home Village" },
  { value: "Transitional Housing", label: "Transitional Housing" },
  { value: "Crisis Housing", label: "Crisis Housing" },
  { value: "Interim Housing", label: "Interim Housing" },
  { value: "Inside Safe", label: "Inside Safe" },
  { value: "A Bridge Home (ABH)", label: "A Bridge Home (ABH)" },
  { value: "Bridge Housing", label: "Bridge Housing" },
  // { value: "A Bridge Home", label: "A Bridge Home" }
];

// Text for intro modal
const introText = `
  <div>
 <p>The purpose of this map is to help community members across the city understand the
landscape of housing resources available to our unhoused community members. It is an
informational tool. A majority of interim housing sites in the City of Los Angeles are NOT walk-up
sites. Many sites require a referral from a service provider and/or a match to a bed for
admittance. There is currently no centralized system to view real time bed availability in the City
of Los Angeles.
</p>
 <br>
<p><strong>Source: </strong><a className="underline text-blue-600" href="https://www.lahsa.org/homeless-count/hic/">LAHSA’s 2024 Housing Inventory Count</a>, updated as of Jan. 24, 2024</p>
    <br> <p>Domestic Violence (DV) and Human Immunodeficiency Virus (HIV) sites are excluded for
confidentiality purposes.
 </p>
  </div>
`;

// Text for map terms modal (definitions)
const mapTermsText = `
  <div>
    
    <p><strong>Permanent Supportive Housing (PSH)</strong> - Permanent housing with assistance (e.g., long-term leasing or rental assistance) and supportive services for households with a disability, aimed at achieving housing stability.</p>
    <p><strong>Rapid Re-Housing (RRH)</strong> - Short-term rental assistance and services to help people obtain housing quickly, increase self-sufficiency, and stay housed. Offered without preconditions such as employment or sobriety.</p>
    <p><strong>Other Permanent Housing (OPH)</strong> - A type of permanent housing with ongoing rental assistance, but with limited or no supportive services. Tenants pay 30% of their income towards housing.</p>
  </div>
`;

// Text for shelter types modal (Winter Shelter, Recuperative Care, etc.)
const shelterTypesText = `
  <div>
 
    <p><strong>Winter Shelter</strong> - Emergency shelters providing a safe place to sleep, meals, and other services during winter months, operating from November 1st - March 31st. <a href="https://www.lahsa.org/winter-shelter" target="_blank">Learn more.</a></p>
    <p><strong>Recuperative Care</strong> - Also referred to as medical respite care, provides short-term residential care for homeless individuals recovering from illness or injury who no longer require hospitalization but need a stable environment to heal.</p>
    <p><strong>Re-entry</strong> - Beds for individuals exiting criminal justice institutions.</p>
    <p><strong>Department of Mental Health (DMH)</strong> - Temporary shelter for homeless adults with mental illness who are willing to receive treatment.</p>
    <p><strong>A Bridge Home (ABH)</strong> - A temporary housing initiative launched in 2018 offering shelter and supportive services to people transitioning to permanent housing. ABH emphasizes local impact by setting up sites near previous encampments, offers a focused timeline for transitioning people to permanent housing, is smaller in scale than traditional shelters, and has fewer barriers for access.</p>
  </div>
`;

const InterimHousing = () => {
  const cdValues = optionsCd.map((entry) => entry.value);
  const initialSelectedValues = projTypes.map((entry) => entry.value);
  const populationServedValues = populationServed.map((entry) => entry.value);
  const projectTypeValues = projectType.map((entry) => entry.value);

  const [filteredCD, setFilteredCD] = useState(cdValues);
  const [filteredProjTypes, setFilteredProjTypes] = useState(initialSelectedValues);
  const [filteredPopulationServed, setFilteredPopulationServed] = useState(populationServedValues);
  const [filteredProjectType, setFilteredProjectType] = useState(projectTypeValues);
  const [selectedfilteropened, setselectedfilteropened] = useState("cd");
  const [filterpanelopened, setfilterpanelopened] = useState(true);
  const [introVisible, setIntroVisible] = useState(true); // State for intro modal visibility
  const [mapTermsVisible, setMapTermsVisible] = useState(false); // State for map terms modal visibility
  const [shelterTypesVisible, setShelterTypesVisible] = useState(false); // State for shelter types modal visibility
  const mapref = useRef(null);
  const divRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1Ijoia2VubmV0aG1lamlhIiwiYSI6ImNseGV6b3c0djAyOGYyc3B3a3Bzd2xtNXEifQ.iNXcgdwigbqLTpSYbMJUOg";

    const mapparams = {
      container: divRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-118.41, 34],
      zoom: 10,
    };

    const map = new mapboxgl.Map(mapparams);
    mapref.current = map;

    const geoJsonData = {
      type: "FeatureCollection",
      features: geoData?.features,
    };

    const councilDistrictData = {
      type: "FeatureCollection",
      features: CouncilDist.features.map((feature) => ({
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: feature.geometry.coordinates,
        },
        properties: {
          dist_name: feature.properties.dist_name,
          district: feature.properties.district,
        },
      })),
    };

    map.on("load", () => {
      // Add the interim housing points source
      map.addSource("interim-housing-source", {
        type: "geojson",
        data: geoJsonData,
      });

      // Add the council district boundaries source
      map.addSource("cd-boundaries-source", {
        type: "geojson",
        data: councilDistrictData,
      });

      // Add the council district boundaries layer (ensure this is added first so it's below the points)
      map.addLayer({
        id: "cd-boundaries",
        type: "line",
        source: "cd-boundaries-source",
        paint: {
          "line-color": "#ffffff",
          "line-width": 2,
        },
      });

      // Add the interim housing points layer (ensure it's above the boundaries)
      map.addLayer({
        id: "interimhousing",
        type: "circle",
        source: "interim-housing-source",
        paint: {
          "circle-radius": 5,
          "circle-color": "#41ffca",
          "circle-stroke-color": "#41ffca",
          "circle-stroke-width": 1,
          "circle-opacity": 0.8,
        },
      });

      // Initialize popup for tooltips
      let popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      // Mousemove event for showing the popup
      map.on("mousemove", "interimhousing", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features[0];
        const coordinates = feature.geometry.coordinates.slice();
        const description = e.features?.map(feature => {
          return (
            `
          <div>
            <p><strong>Organization:</strong> ${feature.properties["Organization Name"]}</p>
            <p><strong>Project Name:</strong> ${feature.properties["Project Name"]}</p>
            <p><strong>HUD Classification:</strong> ${feature.properties["ProjType"]}</p>
            <p><strong>Population Served:</strong> ${feature.properties["PopulationServed"]}</p>
            <p><strong>Total Beds:</strong> ${feature.properties["Total Beds"]}</p>
          </div>
        `)
        });

        popup.setLngLat(coordinates)
          .setHTML(description)
          .addTo(map);
      });

      // Mouseleave event to hide the popup
      map.on("mouseleave", "interimhousing", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
    });

    return () => map.remove();
  }, []);

  const toggleMapTerms = () => {
    setMapTermsVisible((prev) => !prev);
  };

  const toggleShelterTypes = () => {
    setShelterTypesVisible((prev) => !prev);
  };

  const closeIntroModal = () => {
    setIntroVisible(false);
  };

  const handleProjType = (event) => {
    setFilteredProjTypes(event);
    mapref.current.setFilter("interimhousing", ["in", ["get", "ProjType"], ["literal", event]]);
  };

  const handlePopulationServed = (event) => {
    setFilteredPopulationServed(event);
    mapref.current.setFilter("interimhousing", ["in", ["get", "PopulationServed"], ["literal", event]]);
  };

  const handleProjectType = (selectedTypes) => {
    setFilteredProjectType(selectedTypes);
    // if (selectedTypes.length > 0) {
    //   mapref.current.setFilter("interimhousing", [
    //     "match",
    //     ["get", "ProjTypeDescription"],
    //     selectedTypes,
    //     true,
    //     false
    //   ]);
    // } else {
    //   mapref.current.setFilter("interimhousing", null);
    // }
    mapref.current.setFilter("interimhousing", ["in", ["get", "ProjTypeDescription"], ["literal", selectedTypes]]);

  };

  const setfilteredcouncildistrictspre = (event) => {
    setFilteredCD(event);
    mapref.current.setFilter("interimhousing", ["in", ["get", "CD"], ["literal", event]]);
  };

  const selectAllFilters = (filterSetter, values, map, filterName) => {
    filterSetter(values);
    map.setFilter("interimhousing", [
      // "match",
      // ["get", filterName],
      // values,
      // true,
      // false
      "in",
      ["get", filterName],
      ["literal", values],
    ]);
  };

  const unselectAllFilters = (filterSetter, map, filterName) => {
    filterSetter([]);
    map.setFilter("interimhousing", ["in",
      ["get", filterName],
      ["literal", "sndk"]]);

  };

  return (
    <div>
      <MantineProvider>
        <div className="flex-none">
          <Nav />
        </div>

        {/* Filter Panel */}
        <div className={`bottom-0 sm:bottom-auto md:mt-[7.6em] md:ml-3 w-screen sm:w-auto z-50 
            ${filterpanelopened === true ? "absolute " : "hidden"}`}>
          <div className="bg-zinc-900 w-content bg-opacity-90 px-2 py-1 mt-1 sm:rounded-lg">
            <div className="gap-x-0 flex flex-row w-full">
              <button
                onClick={() => setselectedfilteropened("cd")}
                className={`px-2 border-b-2 py-1 font-semibold ${selectedfilteropened === "cd" ? "border-[#41ffca] text-[#41ffca]" : "hover:border-white border-transparent text-gray-50"}`}>
                CD #
              </button>
              <button
                onClick={() => setselectedfilteropened("projType")}
                className={`px-2 border-b-2 py-1 font-semibold ${selectedfilteropened === "projType" ? "border-[#41ffca] text-[#41ffca]" : "hover:border-white border-transparent text-gray-50"}`}>
                HUD Classification
              </button>
              <button
                onClick={() => setselectedfilteropened("population_served")}
                className={`px-2 border-b-2 py-1 font-semibold ${selectedfilteropened === "population_served" ? "border-[#41ffca] text-[#41ffca]" : "hover:border-white border-transparent text-gray-50"}`}>
                Population Served
              </button>
              <button
                onClick={() => setselectedfilteropened("project_type")}
                className={`px-2 border-b-2 py-1 font-semibold ${selectedfilteropened === "project_type" ? "border-[#41ffca] text-[#41ffca]" : "hover:border-white border-transparent text-gray-50"}`}>
                Project Type
              </button>
            </div>

            {/* Filter Content */}
            <div className="pl-5 pr-2 py-2">
              {/* Council District Filter */}
              {selectedfilteropened === "cd" && (
                <div className="pl-5 pr-2 py-2">
                  <div className="flex space-x-2 mb-2">
                    <Button onClick={() => selectAllFilters(setFilteredCD, cdValues, mapref.current, "CD")}>Select All</Button>
                    <Button onClick={() => unselectAllFilters(setFilteredCD, mapref.current, "CD")}>Unselect All</Button>
                  </div>
                  <Checkbox.Group value={filteredCD} onChange={(event) => setfilteredcouncildistrictspre(event)}>
                    <div className={`grid grid-cols-3 gap-x-4 my-2`}>
                      {optionsCd.map((eachEntry) => (
                        <Checkbox id={eachEntry.value} value={eachEntry.value} label={<span className="text-nowrap text-xs"><span className="text-white">{eachEntry.label}</span></span>} key={eachEntry.value} className="my-2" />
                      ))}
                    </div>
                  </Checkbox.Group>
                </div>
              )}

              {/* HUD Classification Filter */}
              {selectedfilteropened === "projType" && (
                <div className="pl-5 pr-2 py-2">
                  <div className="flex space-x-2 mb-2">
                    <Button onClick={() => selectAllFilters(setFilteredProjTypes, initialSelectedValues, mapref.current, "ProjType")}>Select All</Button>
                    <Button onClick={() => unselectAllFilters(setFilteredProjTypes, mapref.current, "ProjType")}>Unselect All</Button>
                  </div>
                  <Checkbox.Group value={filteredProjTypes} onChange={(event) => handleProjType(event)}>
                    <div className={`grid grid-cols-3 gap-x-4 my-2`}>
                      {projTypes.map((eachEntry) => (
                        <Checkbox id={eachEntry.value} value={eachEntry.value} label={<span className="text-nowrap text-xs"><span className="text-white">{eachEntry.label}</span></span>} key={eachEntry.value} className="my-2" />
                      ))}
                    </div>
                  </Checkbox.Group>
                </div>
              )}

              {/* Population Served Filter */}
              {selectedfilteropened === "population_served" && (
                <div className="pl-5 pr-2 py-2">
                  <div className="flex space-x-2 mb-2">
                    <Button onClick={() => selectAllFilters(setFilteredPopulationServed, populationServedValues, mapref.current, "PopulationServed")}>Select All</Button>
                    <Button onClick={() => unselectAllFilters(setFilteredPopulationServed, mapref.current, "PopulationServed")}>Unselect All</Button>
                  </div>
                  <Checkbox.Group value={filteredPopulationServed} onChange={(event) => handlePopulationServed(event)}>
                    <div className={`grid grid-cols-3 gap-x-4 my-2`}>
                      {populationServed.map((eachEntry) => (
                        <Checkbox id={eachEntry.value} value={eachEntry.value} label={<span className="text-nowrap text-xs"><span className="text-white">{eachEntry.label}</span></span>} key={eachEntry.value} className="my-2" />
                      ))}
                    </div>
                  </Checkbox.Group>
                </div>
              )}

              {/* Project Type Filter */}
              {selectedfilteropened === "project_type" && (
                <div className="pl-5 pr-2 py-2">
                  <div className="flex space-x-2 mb-2">
                    <Button onClick={() => selectAllFilters(setFilteredProjectType, projectTypeValues, mapref.current, "ProjTypeDescription")}>Select All</Button>
                    <Button onClick={() => unselectAllFilters(setFilteredProjectType, mapref.current, "ProjTypeDescription")}>Unselect All</Button>
                  </div>
                  <Checkbox.Group value={filteredProjectType} onChange={handleProjectType}>
                    <div className={`grid grid-cols-3 gap-x-4 my-2`}>
                      {projectType.map((eachEntry) => (
                        <Checkbox
                          id={eachEntry.value}
                          value={eachEntry.label} // Use the label since it matches ProjTypeDescription
                          label={<span className="text-nowrap text-xs"><span className="text-white">{eachEntry.label}</span></span>}
                          key={eachEntry.value}
                          className="my-2"
                        />
                      ))}
                    </div>
                  </Checkbox.Group>
                </div>
              )}
            </div>

            {/* Small Buttons for Map Terms and Shelter Types */}
            <div className="pl-5 pr-2 py-2 text-center">
              {/* <Button variant="outline" size="xs" onClick={toggleMapTerms}>Map Terms</Button> */}
              <Button variant="outline" size="xs" onClick={toggleShelterTypes}>Shelter Types</Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => window.open("https://www.lahsa.org/documents?id=8162-2024-housing-inventory-count.xlsx", "_blank")}
              >
                LAHSA’s 2024 Housing Inventory Count (HIC)
              </Button>


            </div>
          </div>
        </div>

        {/* Intro Modal */}
        <Modal opened={introVisible} onClose={closeIntroModal} title="Welcome to the Interim Housing Map">
          <div dangerouslySetInnerHTML={{ __html: introText }} />
        </Modal>

        {/* Map Terms Modal */}
        <Modal opened={mapTermsVisible} onClose={toggleMapTerms} title="Map Terms">
          <div dangerouslySetInnerHTML={{ __html: mapTermsText }} />
        </Modal>

        {/* Shelter Types Modal */}
        <Modal opened={shelterTypesVisible} onClose={toggleShelterTypes} title="Shelter Types">
          <div dangerouslySetInnerHTML={{ __html: shelterTypesText }} />
        </Modal>

        {/* Map Div */}
        <div ref={divRef} style={{ width: "100%", height: "100vh" }} />
      </MantineProvider>
    </div>
  );
};

export default InterimHousing;
