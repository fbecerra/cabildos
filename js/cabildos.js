state = {
  cabildo: 'Todos',
  comision: 'Todas',
  tema: 'Todos',
}
const transitionTime = 500;

const container = d3.select("#cabildos");

Promise.all([d3.json("data/cabildos.json")]).then(function(data){
  let cabildos = data[0];
  console.log(cabildos);

  function getUniqueElements(df, thisVariable) {

    let thisList = df.map(o => o[thisVariable]);

    // uniq() found here https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
    function uniq(a) {
        return a.sort().filter(function(item, pos, ary) {
            return !pos || item != ary[pos - 1];
        });
    }

    let uniqueList = uniq(thisList);

    return uniqueList;
  }

  function addOptions(id, values, attrs) {
    var element = d3.select("#"+id);
    var options = element.selectAll("option").data(values);

    options.enter().append("option")
      .attr("value", (d,i) => attrs[i])
      .html(d => d);

    options.attr("value", (d,i) => attrs[i])
      .html(d => d);

    options.exit().remove();

    return element;
  }

  let allCabildos, allComisiones, allTemas;

  // let allCabildos = getUniqueElements(cabildos.children, 'name');
  // let allComisiones = getUniqueElements(cabildos.children.map(d => d.children).flat(), 'name');
  // let allTemas = getUniqueElements(cabildos.children.map(d => d.children.map(c => c.children).flat()).flat(), 'name');

  function updateOptions() {

    let filteredCabildos = cabildos.children.filter(d => {
      let thisLevel = (d.name === state.cabildo || state.cabildo === 'Todos');
      let lowerLevel = d.children.map(c => state.comision === 'Todas' || c.name === state.comision)
                        .reduce((a,b) => a || b, false);
      let lowerLowerLevel = d.children.map(c => c.children.flat()).flat()
                             .map(e => state.tema === 'Todos' || e.name === state.tema)
                             .reduce((a,b) => a || b, false);
      return (thisLevel && lowerLevel && lowerLowerLevel);
    })

    let filteredComisiones = filteredCabildos.map(d => {
      return d.children.filter(e => {
        let thisLevel = e.name === state.comision || state.comision === 'Todas';
        let lowerLevel = e.children.map(c => state.tema === 'Todos' || c.name === state.tema).reduce((a,b) => a || b, false);
        return (thisLevel && lowerLevel);
      }).flat()
    }).flat()

    let filteredTemas = filteredCabildos.map(d => d.children.filter(e => e.name === state.comision || state.comision === 'Todas').map(c => c.children.filter(e => e.name === state.tema || state.tema === 'Todos')).flat()).flat();

    allCabildos = getUniqueElements(filteredCabildos, 'name');
    allComisiones = getUniqueElements(filteredComisiones, 'name');
    allTemas = getUniqueElements(filteredTemas, 'name');


    let selectCabildo = addOptions("select-cabildo", ['Todos', ...allCabildos], ['Todos', ...allCabildos]);
    if (state.cabildo !== 'Todos') {
      selectCabildo.node().value = state.cabildo;
    } else {
      state.cabildo = selectCabildo.node().value;
    }
    selectCabildo.on("change", (event, d) => {
      state.cabildo = event.target.value;
      updateOptions();
      hideCircles();
    });

    let selectComision = addOptions("select-comision", ['Todas', ...allComisiones], ['Todas', ...allComisiones]);
    if (state.comision !== 'Todos') {
      selectComision.node().value = state.comision;
    } else {
      state.comision = selectComision.node().value;
    }
    selectComision.on("change", (event, d) => {
      state.comision = event.target.value;
      updateOptions();
      hideCircles();
    });

    let selectTema = addOptions("select-tema", ['Todos', ...allTemas], ['Todos', ...allTemas]);
    if (state.tema !== 'Todos') {
      selectTema.node().value = state.tema;
    } else {
      state.tema = selectTema.node().value;
    }
    selectTema.on("change", (event, d) => {
      state.tema = event.target.value;
      updateOptions();
      hideCircles();
    });
  }

  updateOptions();

  function hideCircles() {
    let calculateOpacity = d => {
      if (d.depth === 1) {
        console.log(d)
        let thisLevel = (d.data.name === state.cabildo || state.cabildo === 'Todos');
        let lowerLevel = d.children.map(c => state.comision === 'Todas' || c.data.name === state.comision)
                          .reduce((a,b) => a || b, false);
        let lowerLowerLevel = d.children.map(c => c.children.flat()).flat()
                               .map(e => state.tema === 'Todos' || e.data.name === state.tema)
                               .reduce((a,b) => a || b, false);
        return (thisLevel && lowerLevel && lowerLowerLevel) ? 1 : 0;
      } else if (d.depth === 2) {
        let thisLevel = (d.data.name === state.comision || state.comision === 'Todas');
        let upperLevel = (d.parent.data.name === state.cabildo || state.cabildo === 'Todos');
        let lowerLevel = d.children.map(c => state.tema === 'Todos' || c.data.name === state.tema)
                          .reduce((a,b) => a || b, false);
        return (thisLevel && upperLevel && lowerLevel) ? 1 : 0;
      } else if (d.depth === 3) {
        let thisLevel = (d.data.name === state.tema || state.tema === 'Todos')
        let upperLevel = (d.parent.data.name === state.comision || state.comision === 'Todas');
        let upperUpperLevel = (d.parent.parent.data.name === state.cabildo || state.cabildo === 'Todos');
        return (thisLevel && upperLevel && upperUpperLevel) ? 1 : 0;
      }
    }

    node.transition()
      .duration(transitionTime)
      .attr("opacity", calculateOpacity);

    label.transition()
      .duration(transitionTime)
      .attr("opacity", calculateOpacity);
  }


  let color = d3.scaleLinear()
    .domain([0, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl)

  let format = d3.format(",d");

  const height = 600,
        width = height;
  const charSize = 2;

  let pack = data => d3.pack()
    .size([height, width])
    .padding(charSize)
  (d3.hierarchy(data)
    .sum(d => d.porcentaje)
    .sort((a, b) => b.porcentaje - a.porcentaje));

  const root = pack(cabildos);
  console.log(root)
  let focus = root;
  let view;
  const svgHeight = 700,
        svgWidth = 1.5 * width;

  const svg = d3.select("#cabildos").append("svg")
      .attr("viewBox", [0, 0, svgWidth, svgHeight])
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("style", "max-width: 100%; height: auto; height: intrinsic; position: relative;")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "middle")
      // .attr("transform", `scale(1.4)`);

  const offset = (height - svgWidth) / 2;

  function updateDiv(id) {

    let svgBarMargin = {top: 0, left: 20, bottom: 20, right: 0},
        svgBarWidth = 500 - svgBarMargin.left - svgBarMargin.right,
        svgBarHeight = 700 - svgBarMargin.top - svgBarMargin.bottom;

    let cabildo = cabildos.children.filter(d => d.name == id);
    let comisiones = cabildo[0].children.sort((a, b) => ('' + a.name).localeCompare(b.name))
    let temas = cabildo[0].children.map(c => c.children.flat()).flat().sort((a,b) => b.porcentaje - a.porcentaje);

    let xScale = d3.scaleLinear()
      .domain([0, temas[0].porcentaje])
      .range([svgBarMargin.left, svgBarWidth]);

    let yScale = d3.scaleBand()
      .domain(d3.range(temas.length))
      .range([svgBarMargin.top, svgBarHeight])
      .padding(0.1);

    console.log(yScale(0), temas.length)

    let xAxis = d3.axisBottom(xScale),
        yAxis = d3.axisLeft(yScale).ticks(10);

    let details = d3.select("#details");

    let divCabildo = details.selectAll(".title")
      .data(cabildo)
      .join("div")
        .attr("class", "title")
        .html(d => d.name);

    let svgBar = details.selectAll("svg")
      .data(cabildo)
      .join("svg")
        .attr("class", ".bar-chart")
        .attr("width", svgBarWidth)
        .attr("height", svgBarHeight)

    svgBar.append("g")
      .attr("transform", `translate(0,${svgBarHeight})`)
      .call(xAxis)

    svgBar.append("g")
      .attr("transform", `translate(${svgBarMargin.left},0)`)
      .call(yAxis)

    let gBar = svgBar.selectAll(".bar-group")
      .data(d => [d])
      .join("g")
        .attr("class", ".bar-group")
        .attr("transform", `translate(${svgBarMargin.left},${svgBarMargin.top})`)

    gBar.selectAll("rect")
      .data(temas)
      .join("rect")
        .attr("class", "bar")
        .attr("x", xScale(0))
        .attr("y", (d, i) => yScale(i))
        .attr("width", d => xScale(d.porcentaje) - xScale(0))
        .attr("height", yScale.bandwidth());



  }

  function showBubbles() {
    d3.select("#bubbles").style("display", "flex");
  }

  function hideBubbles() {
    d3.select("#bubbles").style("display", "none");
  }

  function showDetails() {
    d3.select("#cabildo-details").style("display", "flex");
  }

  function hideDetails() {
    d3.select("#cabildo-details").style("display", "none");
  }

  d3.select("#back-button").on("click", () => {
    hideDetails();
    showBubbles();
  })

  const node = svg.append("g")
    .style("transform", `translate(-40px, -${offset}px)`)
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
      .attr('stroke', d => d.depth === 1 ? 'lightgrey' : color(d.data.comision))
      .attr('stroke-width', 1.0)
      .attr("fill", d => d.children ? "white" : cabildos.comisiones[d.data.comision].color)
      .attr("pointer-events", d => !d.children ? "none" : null)
      .attr("cx", d => 1.4 * d.y)
      .attr("cy", d => 1.4 * d.x - 150)
      .attr("r", d => 1.4 * d.r)
      .on("click", (event, d) => {
        console.log(d);
        updateDiv('Plataforma CC'); //updateDiv(d.cabildo);
        hideBubbles();
        showDetails();
      })
      // .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
      // .on("mouseout", function() { d3.select(this).attr("stroke", "lightgrey"); })

  const label = svg.append("g")
      .style("font", "10px sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("transform", `translate(0, -${offset}px)`)
      // .style("transform", "rotate(90)")
    .selectAll("text")
    .data(root.descendants().slice(1).filter(function(d) { return !d.children; }))
    .join("text")
      .attr("x", d => 1.4 * d.y)
      .attr("y", d => 1.4 * d.x - 150)
      .style("fill-opacity", 1)
      .style("display", "inline")
      .text(d => d.r > 15 ? d.data.name.slice(0, 10) : null)
      // .attr("transform", "rotate(0.1)")

})
